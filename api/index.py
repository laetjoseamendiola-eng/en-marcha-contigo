import os
import sys
import jwt
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.pool import NullPool

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Clave secreta para JWT
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'en-marcha-contigo-dev-key-change-in-prod')

# Configuración de base de datos: Neon PostgreSQL en producción, SQLite como fallback local.
database_url = os.environ.get('DATABASE_URL', 'sqlite:////tmp/app.db')

# Neon usa postgresql:// pero SQLAlchemy necesita postgresql+psycopg2://
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql+psycopg2://', 1)
elif database_url.startswith('postgresql://') and '+' not in database_url.split('://')[0]:
    database_url = database_url.replace('postgresql://', 'postgresql+psycopg2://', 1)

# Agregar sslmode=require para Neon si no está presente
if 'postgresql' in database_url and 'sslmode' not in database_url:
    separator = '&' if '?' in database_url else '?'
    database_url = database_url + separator + 'sslmode=require'

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Para entornos serverless (Vercel), usar NullPool: cada invocación crea su propia conexión.
# Esto evita problemas de conexiones obsoletas y pool exhaustion en serverless.
if 'postgresql' in database_url:
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'poolclass': NullPool,
        'connect_args': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',
        },
    }

db = SQLAlchemy(app)


# =============================================
# MODELOS
# =============================================

class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)

    sintomas = db.relationship('Sintoma', backref='usuario', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
            'activo': self.activo
        }


class Sintoma(db.Model):
    __tablename__ = 'sintomas'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    intensidad = db.Column(db.Integer, nullable=False)
    duracion = db.Column(db.Integer, nullable=False)
    localizacion = db.Column(db.String(100), nullable=False)
    notas = db.Column(db.Text)
    fecha_registro = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'tipo': self.tipo,
            'intensidad': self.intensidad,
            'duracion': self.duracion,
            'localizacion': self.localizacion,
            'notas': self.notas,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
        }


# Inicialización lazy de tablas: no crashear el módulo si la BD no está disponible al arrancar.
_tables_initialized = False


def ensure_tables():
    """Crea las tablas si no existen. Se llama en el primer request, no al importar el módulo."""
    global _tables_initialized
    if not _tables_initialized:
        try:
            with app.app_context():
                db.create_all()
            _tables_initialized = True
        except Exception as e:
            print(f"[WARN] No se pudieron crear las tablas: {e}", file=sys.stderr)


@app.before_request
def before_request_handler():
    """Asegurar que las tablas existan antes de cada request."""
    ensure_tables()


# =============================================
# MIDDLEWARE DE AUTENTICACIÓN
# =============================================

def token_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Token de autenticación requerido'}), 401

        try:
            datos = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            usuario_actual = db.session.get(Usuario, datos['usuario_id'])
            if not usuario_actual or not usuario_actual.activo:
                return jsonify({'error': 'Usuario no válido o inactivo'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado. Inicia sesión nuevamente'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token no válido'}), 401

        return f(usuario_actual, *args, **kwargs)
    return decorador


def generar_token(usuario):
    payload = {
        'usuario_id': usuario.id,
        'email': usuario.email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


# =============================================
# ENDPOINTS DE AUTENTICACIÓN
# =============================================

@app.route('/api/auth/registro', methods=['POST'])
def registro():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Datos no proporcionados'}), 400

        if not data.get('nombre') or not data.get('nombre').strip():
            return jsonify({'error': 'El nombre es requerido'}), 400
        if not data.get('email') or not data.get('email').strip():
            return jsonify({'error': 'El email es requerido'}), 400
        if not data.get('password') or len(data.get('password', '')) < 6:
            return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

        email = data['email'].strip().lower()
        nombre = data['nombre'].strip()

        # Verificar si el email ya existe
        usuario_existente = Usuario.query.filter_by(email=email).first()
        if usuario_existente:
            return jsonify({'error': 'Este email ya está registrado'}), 409

        # Crear usuario
        nuevo_usuario = Usuario(
            nombre=nombre,
            email=email,
            password_hash=generate_password_hash(data['password'])
        )

        db.session.add(nuevo_usuario)
        db.session.commit()

        token = generar_token(nuevo_usuario)

        return jsonify({
            'mensaje': 'Usuario registrado exitosamente',
            'token': token,
            'usuario': nuevo_usuario.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Datos no proporcionados'}), 400

        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400

        email = data['email'].strip().lower()
        usuario = Usuario.query.filter_by(email=email).first()

        if not usuario or not check_password_hash(usuario.password_hash, data['password']):
            return jsonify({'error': 'Email o contraseña incorrectos'}), 401

        if not usuario.activo:
            return jsonify({'error': 'Cuenta desactivada'}), 403

        token = generar_token(usuario)

        return jsonify({
            'mensaje': 'Inicio de sesión exitoso',
            'token': token,
            'usuario': usuario.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500


@app.route('/api/auth/perfil', methods=['GET'])
@token_requerido
def obtener_perfil(usuario_actual):
    return jsonify({'usuario': usuario_actual.to_dict()}), 200


# =============================================
# ENDPOINTS DE SÍNTOMAS (PROTEGIDOS)
# =============================================

@app.route('/api/sintomas', methods=['POST'])
@token_requerido
def crear_sintoma(usuario_actual):
    try:
        data = request.get_json()

        if not data.get('tipo'):
            return jsonify({'error': 'tipo es requerido'}), 400
        if not isinstance(data.get('intensidad'), int) or data['intensidad'] < 1 or data['intensidad'] > 5:
            return jsonify({'error': 'intensidad debe ser un número entre 1 y 5'}), 400
        if not data.get('duracion') or data['duracion'] < 1:
            return jsonify({'error': 'duracion debe ser mayor a 0'}), 400
        if not data.get('localizacion'):
            return jsonify({'error': 'localizacion es requerida'}), 400

        sintoma = Sintoma(
            usuario_id=usuario_actual.id,
            tipo=data['tipo'],
            intensidad=data['intensidad'],
            duracion=data['duracion'],
            localizacion=data['localizacion'],
            notas=data.get('notas', '')
        )

        db.session.add(sintoma)
        db.session.commit()

        return jsonify(sintoma.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas', methods=['GET'])
@token_requerido
def obtener_sintomas(usuario_actual):
    try:
        sintomas = Sintoma.query.filter_by(usuario_id=usuario_actual.id).order_by(Sintoma.fecha_registro.desc()).all()
        return jsonify([s.to_dict() for s in sintomas]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas/<int:sintoma_id>', methods=['GET'])
@token_requerido
def obtener_sintoma(usuario_actual, sintoma_id):
    try:
        sintoma = db.session.get(Sintoma, sintoma_id)
        if not sintoma:
            return jsonify({'error': 'Síntoma no encontrado'}), 404
        if sintoma.usuario_id != usuario_actual.id:
            return jsonify({'error': 'No autorizado'}), 403
        return jsonify(sintoma.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas/<int:sintoma_id>', methods=['PUT'])
@token_requerido
def actualizar_sintoma(usuario_actual, sintoma_id):
    try:
        sintoma = db.session.get(Sintoma, sintoma_id)
        if not sintoma:
            return jsonify({'error': 'Síntoma no encontrado'}), 404
        if sintoma.usuario_id != usuario_actual.id:
            return jsonify({'error': 'No autorizado'}), 403

        data = request.get_json()

        if 'tipo' in data:
            sintoma.tipo = data['tipo']
        if 'intensidad' in data:
            if not isinstance(data['intensidad'], int) or data['intensidad'] < 1 or data['intensidad'] > 5:
                return jsonify({'error': 'intensidad debe ser un número entre 1 y 5'}), 400
            sintoma.intensidad = data['intensidad']
        if 'duracion' in data:
            if data['duracion'] < 1:
                return jsonify({'error': 'duracion debe ser mayor a 0'}), 400
            sintoma.duracion = data['duracion']
        if 'localizacion' in data:
            sintoma.localizacion = data['localizacion']
        if 'notas' in data:
            sintoma.notas = data['notas']

        db.session.commit()

        return jsonify(sintoma.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas/<int:sintoma_id>', methods=['DELETE'])
@token_requerido
def eliminar_sintoma(usuario_actual, sintoma_id):
    try:
        sintoma = db.session.get(Sintoma, sintoma_id)
        if not sintoma:
            return jsonify({'error': 'Síntoma no encontrado'}), 404
        if sintoma.usuario_id != usuario_actual.id:
            return jsonify({'error': 'No autorizado'}), 403

        db.session.delete(sintoma)
        db.session.commit()

        return jsonify({'mensaje': 'Síntoma eliminado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas/stats', methods=['GET'])
@token_requerido
def estadisticas_sintomas(usuario_actual):
    try:
        sintomas = Sintoma.query.filter_by(usuario_id=usuario_actual.id).all()

        if not sintomas:
            return jsonify({
                'total': 0,
                'promedio_intensidad': 0,
                'sintoma_mas_frecuente': None,
                'duracion_promedio': 0
            }), 200

        intensidades = [s.intensidad for s in sintomas]
        duraciones = [s.duracion for s in sintomas]
        tipos = [s.tipo for s in sintomas]

        sintoma_mas_frecuente = max(set(tipos), key=tipos.count) if tipos else None

        stats = {
            'total': len(sintomas),
            'promedio_intensidad': round(sum(intensidades) / len(intensidades), 2),
            'sintoma_mas_frecuente': sintoma_mas_frecuente,
            'duracion_promedio': round(sum(duraciones) / len(duraciones), 2),
            'registros_por_tipo': {}
        }

        for tipo in set(tipos):
            stats['registros_por_tipo'][tipo] = tipos.count(tipo)

        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Endpoint de salud que verifica la conexión a la base de datos."""
    db_status = 'unknown'
    db_type = 'sqlite'

    if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI']:
        db_type = 'postgresql'

    try:
        with app.app_context():
            db.session.execute(db.text('SELECT 1'))
            db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'

    return jsonify({
        'status': 'ok',
        'database_type': db_type,
        'database_status': db_status,
        'auth': 'enabled',
        'python_version': sys.version,
        'env_vars': {
            'DATABASE_URL': 'set' if os.environ.get('DATABASE_URL') else 'not set',
            'SECRET_KEY': 'set' if os.environ.get('SECRET_KEY') else 'not set',
        }
    }), 200
