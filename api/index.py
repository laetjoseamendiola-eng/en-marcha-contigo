import os
import sys
import hashlib
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


class CodigoTester(db.Model):
    # Guarda solo el hash SHA-256 del código, nunca el código en texto.
    # Cada código sirve una vez: al crear la cuenta, la fila se borra.
    __tablename__ = 'codigos_tester'

    id = db.Column(db.Integer, primary_key=True)
    codigo_hash = db.Column(db.String(64), unique=True, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.datetime.utcnow)


DURACIONES_VALIDAS = [
    'Menos de 30 min',
    '30 min a 4 h',
    '4 a 12 h',
    '12 h a 1 día',
    'Más de 1 día',
    'Todavía presente',
]


class Sintoma(db.Model):
    __tablename__ = 'sintomas'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    intensidad = db.Column(db.Integer, nullable=False)
    duracion = db.Column(db.String(30), nullable=False)
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


# =============================================
# MODELO: MEDICAMENTOS PROGRAMADOS
# =============================================

class MedicamentoProgramado(db.Model):
    """
    Catálogo de medicamentos del usuario con sus horarios programados.
    Pre-cargado para José Antonio con su receta real (02/07/2026, Dr. Yamil Matuk).
    """
    __tablename__ = 'medicamentos_programados'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)          # "Levodopa/Carbidopa"
    principio_activo = db.Column(db.String(200))                # "Levodopa 250mg / Carbidopa 25mg"
    dosis = db.Column(db.String(50), nullable=False)            # "½ tableta"
    horarios = db.Column(db.Text, nullable=False)               # JSON: ["08:00","12:00","16:00","20:00"]
    instrucciones = db.Column(db.Text)                          # "Separar al menos 1hr de comidas"
    separacion_comida_min = db.Column(db.Integer, default=0)    # minutos de separación requerida (60 para Levodopa/Carbidopa)
    activo = db.Column(db.Boolean, default=True)
    fecha_inicio = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    tomas = db.relationship('TomaRegistrada', backref='medicamento', lazy=True)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'nombre': self.nombre,
            'principio_activo': self.principio_activo,
            'dosis': self.dosis,
            'horarios': json.loads(self.horarios) if self.horarios else [],
            'instrucciones': self.instrucciones,
            'separacion_comida_min': self.separacion_comida_min,
            'activo': self.activo,
        }


class TomaRegistrada(db.Model):
    """
    Registro de cada toma real con timestamp exacto.
    Permite detectar adherencia, desvíos y correlacionar con estado motor.
    """
    __tablename__ = 'tomas_registradas'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    medicamento_id = db.Column(db.Integer, db.ForeignKey('medicamentos_programados.id'), nullable=False)
    horario_programado = db.Column(db.String(5), nullable=False)   # "08:00"
    fecha_programada = db.Column(db.DateTime, nullable=False)      # fecha+hora programada
    fecha_toma_real = db.Column(db.DateTime)                       # cuándo realmente se tomó (null = no tomada)
    tomada = db.Column(db.Boolean, default=False)
    omitida = db.Column(db.Boolean, default=False)
    desvio_minutos = db.Column(db.Integer)                         # positivo=tarde, negativo=temprano
    notas = db.Column(db.Text)
    fecha_registro = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'medicamento_id': self.medicamento_id,
            'medicamento_nombre': self.medicamento.nombre if self.medicamento else None,
            'horario_programado': self.horario_programado,
            'fecha_programada': self.fecha_programada.isoformat() if self.fecha_programada else None,
            'fecha_toma_real': self.fecha_toma_real.isoformat() if self.fecha_toma_real else None,
            'tomada': self.tomada,
            'omitida': self.omitida,
            'desvio_minutos': self.desvio_minutos,
            'notas': self.notas,
        }


class FluctuacionMotora(db.Model):
    """
    Bitácora de estado motor tipo Diario de Hauser.
    Bloques de 30 minutos a lo largo del día.
    Estados: ON | OFF | ON_DISCINESIA_LEVE | ON_DISCINESIA_GRAVE | DORMIDO
    """
    __tablename__ = 'fluctuaciones_motoras'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    hora_bloque = db.Column(db.String(5), nullable=False)          # "08:00", "08:30", etc.
    estado = db.Column(db.String(30), nullable=False)              # ON | OFF | ON_DISC_LEVE | ON_DISC_GRAVE | DORMIDO
    notas = db.Column(db.Text)
    fecha_registro = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'hora_bloque': self.hora_bloque,
            'estado': self.estado,
            'notas': self.notas,
        }


class RegistroDiario(db.Model):
    """
    Cuestionario diario de síntomas no motores.
    Inspirado en dominios del MDS-UPDRS parte 1 (no motor) y experiencia clínica.
    Registra cómo se siente el paciente en general ese día.
    Escala 0-4 donde 0=sin problema y 4=muy grave (igual que MDS-UPDRS).
    """
    __tablename__ = 'registros_diarios'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)

    # Energía y fatiga (infografía: afecta 40-80% de pacientes)
    energia = db.Column(db.Integer)          # 0=sin fatiga, 4=fatiga extrema
    # Sueño nocturno (infografía: 6 tipos de alteraciones del sueño)
    calidad_sueno = db.Column(db.Integer)    # 0=dormí bien, 4=noche muy mala
    # Somnolencia diurna
    somnolencia = db.Column(db.Integer)      # 0=sin somnolencia, 4=dormí en actividades
    # Ánimo (depresión es síntoma prodromico y no motor frecuente)
    animo = db.Column(db.Integer)            # 0=buen ánimo, 4=muy triste/sin motivación
    # Ansiedad
    ansiedad = db.Column(db.Integer)         # 0=tranquilo, 4=muy ansioso
    # Digestión / estreñimiento (síntoma prodrónico común)
    digestion = db.Column(db.Integer)        # 0=normal, 4=estreñimiento grave
    # Náuseas (efecto secundario frecuente de medicamentos)
    nauseas = db.Column(db.Integer)          # 0=sin náuseas, 4=náuseas todo el día
    # Dolor general
    dolor = db.Column(db.Integer)            # 0=sin dolor, 4=dolor intenso
    # Apetito / olfato (hiposmia es síntoma prodrónico)
    apetito = db.Column(db.Integer)          # 0=normal, 4=sin apetito
    # Nota libre del día
    nota_dia = db.Column(db.Text)

    fecha_registro = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Restricción única: un registro por usuario por día
    __table_args__ = (
        db.UniqueConstraint('usuario_id', 'fecha', name='uq_registro_diario_usuario_fecha'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'energia': self.energia,
            'calidad_sueno': self.calidad_sueno,
            'somnolencia': self.somnolencia,
            'animo': self.animo,
            'ansiedad': self.ansiedad,
            'digestion': self.digestion,
            'nauseas': self.nauseas,
            'dolor': self.dolor,
            'apetito': self.apetito,
            'nota_dia': self.nota_dia,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
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

        codigo = (data.get('codigo') or '').strip()
        if not codigo:
            return jsonify({'error': 'El código de tester es requerido'}), 400
        codigo_hash = hashlib.sha256(codigo.encode('utf-8')).hexdigest()
        codigo_row = CodigoTester.query.filter_by(codigo_hash=codigo_hash).first()
        if not codigo_row:
            return jsonify({'error': 'Código inválido o ya utilizado'}), 403

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
        db.session.delete(codigo_row)  # el código se descarta al usarse
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
        if data.get('duracion') not in DURACIONES_VALIDAS:
            return jsonify({'error': 'duracion no es una opción válida'}), 400
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
            if data['duracion'] not in DURACIONES_VALIDAS:
                return jsonify({'error': 'duracion no es una opción válida'}), 400
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
                'duracion_frecuente': None
            }), 200

        intensidades = [s.intensidad for s in sintomas]
        duraciones = [s.duracion for s in sintomas]
        duracion_frecuente = max(set(duraciones), key=duraciones.count)
        tipos = [s.tipo for s in sintomas]

        sintoma_mas_frecuente = max(set(tipos), key=tipos.count) if tipos else None

        stats = {
            'total': len(sintomas),
            'promedio_intensidad': round(sum(intensidades) / len(intensidades), 2),
            'sintoma_mas_frecuente': sintoma_mas_frecuente,
            'duracion_frecuente': duracion_frecuente,
            'registros_por_tipo': {}
        }

        for tipo in set(tipos):
            stats['registros_por_tipo'][tipo] = tipos.count(tipo)

        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas/evolucion', methods=['GET'])
@token_requerido
def evolucion_sintomas(usuario_actual):
    """
    Devuelve datos de evolución temporal agrupados por día.
    Query params:
      - dias: número de días hacia atrás (default 30)
      - tipo: filtrar por tipo de síntoma (opcional)
    """
    try:
        dias = int(request.args.get('dias', 30))
        tipo_filtro = request.args.get('tipo', None)

        fecha_inicio = datetime.datetime.utcnow() - datetime.timedelta(days=dias)

        query = Sintoma.query.filter(
            Sintoma.usuario_id == usuario_actual.id,
            Sintoma.fecha_registro >= fecha_inicio
        )

        if tipo_filtro:
            query = query.filter(Sintoma.tipo == tipo_filtro)

        sintomas = query.order_by(Sintoma.fecha_registro.asc()).all()

        # Agrupar por fecha (día)
        datos_por_dia = {}
        tipos_encontrados = set()

        for s in sintomas:
            dia = s.fecha_registro.strftime('%Y-%m-%d')
            tipos_encontrados.add(s.tipo)

            if dia not in datos_por_dia:
                datos_por_dia[dia] = {
                    'fecha': dia,
                    'intensidad_promedio': [],
                    'total_registros': 0,
                    'por_tipo': {}
                }

            datos_por_dia[dia]['intensidad_promedio'].append(s.intensidad)
            datos_por_dia[dia]['total_registros'] += 1

            if s.tipo not in datos_por_dia[dia]['por_tipo']:
                datos_por_dia[dia]['por_tipo'][s.tipo] = {
                    'intensidades': [],
                    'count': 0
                }
            datos_por_dia[dia]['por_tipo'][s.tipo]['intensidades'].append(s.intensidad)
            datos_por_dia[dia]['por_tipo'][s.tipo]['count'] += 1

        # Calcular promedios
        serie_temporal = []
        for dia, datos in sorted(datos_por_dia.items()):
            entrada = {
                'fecha': dia,
                'intensidad_promedio': round(
                    sum(datos['intensidad_promedio']) / len(datos['intensidad_promedio']), 1
                ),
                'total_registros': datos['total_registros']
            }
            # Intensidad promedio por tipo ese día
            for tipo, info in datos['por_tipo'].items():
                entrada[f'intensidad_{tipo}'] = round(
                    sum(info['intensidades']) / len(info['intensidades']), 1
                )
            serie_temporal.append(entrada)

        return jsonify({
            'serie_temporal': serie_temporal,
            'tipos_disponibles': sorted(list(tipos_encontrados)),
            'dias_consultados': dias,
            'total_registros': len(sintomas)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================
# MÓDULO DE FÁRMACOS
# =============================================

@app.route('/api/medicamentos', methods=['GET'])
@token_requerido
def listar_medicamentos(usuario_actual):
    """Lista los medicamentos programados del usuario."""
    try:
        medicamentos = MedicamentoProgramado.query.filter_by(
            usuario_id=usuario_actual.id, activo=True
        ).all()
        return jsonify([m.to_dict() for m in medicamentos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def validar_horarios(lista):
    """Devuelve la lista de horarios HH:MM (24 h) válidos, ordenada y sin repetir. None si alguno no es válido."""
    import re
    if not isinstance(lista, list) or not lista:
        return None
    limpios = set()
    for h in lista:
        if not isinstance(h, str) or not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', h.strip()):
            return None
        limpios.add(h.strip())
    return sorted(limpios)


def validar_separacion(valor):
    """Minutos de separación de comida (0 a 1440). None si no es válido."""
    try:
        minutos = int(valor or 0)
    except (TypeError, ValueError):
        return None
    return minutos if 0 <= minutos <= 1440 else None


@app.route('/api/medicamentos', methods=['POST'])
@token_requerido
def crear_medicamento(usuario_actual):
    """Agrega un medicamento registrado por el propio usuario."""
    import json
    data = request.get_json(silent=True) or {}
    # Tres datos: sustancia activa, dosis y horarios
    sustancia = (data.get('principio_activo') or '').strip()
    dosis = (data.get('dosis') or '').strip()
    horarios = data.get('horarios') or []
    if not sustancia or not dosis or not horarios:
        return jsonify({'error': 'Sustancia activa, dosis y al menos un horario son obligatorios'}), 400
    horarios_limpios = validar_horarios(horarios)
    if not horarios_limpios:
        return jsonify({'error': 'Cada horario debe ser una hora real (HH:MM, 00:00 a 23:59)'}), 400
    separacion = validar_separacion(data.get('separacion_comida_min', 0))
    if separacion is None:
        return jsonify({'error': 'El tiempo de separación debe ser entre 0 y 1440 minutos'}), 400
    try:
        nuevo = MedicamentoProgramado(
            usuario_id=usuario_actual.id,
            nombre=sustancia,               # el nombre visible es la sustancia activa
            principio_activo=sustancia,
            dosis=dosis,
            horarios=json.dumps(horarios_limpios),
            separacion_comida_min=separacion,
            activo=True,
        )
        db.session.add(nuevo)
        db.session.commit()
        return jsonify(nuevo.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/medicamentos/<int:med_id>', methods=['PUT'])
@token_requerido
def editar_medicamento(usuario_actual, med_id):
    """
    Edita un medicamento. Si cambian la dosis o los horarios, el valor anterior
    se cierra con fecha de fin en historial_dosis y el nuevo queda con fecha de inicio.
    """
    import json
    from sqlalchemy import text
    med = MedicamentoProgramado.query.filter_by(id=med_id, usuario_id=usuario_actual.id, activo=True).first()
    if not med:
        return jsonify({'error': 'Medicamento no encontrado'}), 404
    data = request.get_json(silent=True) or {}

    nueva_dosis = (data.get('dosis') if 'dosis' in data else med.dosis) or ''
    nueva_dosis = nueva_dosis.strip()
    if 'horarios' in data:
        horarios_nuevos = validar_horarios(data.get('horarios'))
        if not horarios_nuevos:
            return jsonify({'error': 'Cada horario debe ser una hora real (HH:MM, 00:00 a 23:59)'}), 400
    else:
        horarios_nuevos = json.loads(med.horarios or '[]')
    separacion_nueva = None
    if 'separacion_comida_min' in data:
        separacion_nueva = validar_separacion(data.get('separacion_comida_min'))
        if separacion_nueva is None:
            return jsonify({'error': 'El tiempo de separación debe ser entre 0 y 1440 minutos'}), 400
    if 'principio_activo' in data and not (data.get('principio_activo') or '').strip():
        return jsonify({'error': 'La sustancia activa no puede quedar vacía'}), 400
    if not nueva_dosis or not horarios_nuevos:
        return jsonify({'error': 'Dosis y al menos un horario son obligatorios'}), 400

    horarios_actuales = json.loads(med.horarios or '[]')
    cambia_dosis = nueva_dosis != (med.dosis or '')
    cambia_horarios = horarios_nuevos != horarios_actuales
    # Hora del cambio en la zona del paciente (la que manda la app, según su configuración de reloj).
    # Así el historial se guarda en la misma hora que las tomas (fecha_programada), no en UTC.
    zona_cambio = zona_de_paciente(data.get('zona'))
    ahora_local = datetime.datetime.now(datetime.timezone.utc).astimezone(zona_cambio).replace(tzinfo=None)
    try:
        if cambia_dosis or cambia_horarios:
            # 1) Si aún no hay historial para este medicamento, guardar la dosis anterior como primer registro.
            #    Su inicio es la fecha de alta del medicamento (fecha_inicio, en UTC, pasada a hora local) y su fin, ahora.
            tiene_historial = db.session.execute(
                text("SELECT 1 FROM historial_dosis WHERE medicamento_id = :m"),
                {'m': med.id}
            ).first()
            if not tiene_historial:
                alta_utc = med.fecha_inicio or datetime.datetime.utcnow()
                alta_local = alta_utc.replace(tzinfo=datetime.timezone.utc).astimezone(zona_cambio).replace(tzinfo=None)
                db.session.execute(
                    text("""INSERT INTO historial_dosis (medicamento_id, dosis, horarios, fecha_inicio, fecha_fin)
                            VALUES (:m, :d, :h, :ini, :ahora)"""),
                    {'m': med.id, 'd': med.dosis, 'h': json.dumps(horarios_actuales),
                     'ini': alta_local, 'ahora': ahora_local}
                )
            # 2) Cerrar la dosis vigente y abrir la nueva con la hora local del cambio.
            db.session.execute(
                text("UPDATE historial_dosis SET fecha_fin = :ahora WHERE medicamento_id = :m AND fecha_fin IS NULL"),
                {'m': med.id, 'ahora': ahora_local}
            )
            db.session.execute(
                text("""INSERT INTO historial_dosis (medicamento_id, dosis, horarios, fecha_inicio, fecha_fin)
                        VALUES (:m, :d, :h, :ahora, NULL)"""),
                {'m': med.id, 'd': nueva_dosis, 'h': json.dumps(horarios_nuevos), 'ahora': ahora_local}
            )
            med.dosis = nueva_dosis
            med.horarios = json.dumps(horarios_nuevos)

        if 'principio_activo' in data and (data['principio_activo'] or '').strip():
            nueva = data['principio_activo'].strip()
            med.principio_activo = nueva
            med.nombre = nueva
        if separacion_nueva is not None:
            med.separacion_comida_min = separacion_nueva
        db.session.commit()
        return jsonify(med.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/medicamentos/<int:med_id>', methods=['DELETE'])
@token_requerido
def eliminar_medicamento(usuario_actual, med_id):
    """'Elimina' un medicamento sin borrar su historial: lo desactiva."""
    med = MedicamentoProgramado.query.filter_by(id=med_id, usuario_id=usuario_actual.id, activo=True).first()
    if not med:
        return jsonify({'error': 'Medicamento no encontrado'}), 404
    try:
        med.activo = False
        db.session.commit()
        return jsonify({'mensaje': 'Medicamento eliminado de tu lista (su historial se conserva)'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/medicamentos/inicializar', methods=['POST'])
@token_requerido
def inicializar_medicamentos(usuario_actual):
    """
    Carga el esquema de medicación de la receta del Dr. Yamil Matuk (02/07/2026).
    Solo crea si el usuario aún no tiene medicamentos registrados.
    """
    # Ya no se carga ninguna receta fija. Cada persona registra sus propios medicamentos.
    return jsonify({
        'mensaje': 'La receta ya no se carga automáticamente. Registra tus medicamentos y dosis.',
    }), 410


@app.route('/api/tomas/hoy', methods=['GET'])
@token_requerido
def tomas_hoy(usuario_actual):
    """
    Devuelve el estado de todas las tomas programadas para hoy.
    Genera las tomas del día si aún no existen.
    """
    import json
    try:
        # "Hoy" y los horarios son la hora de pared del paciente: se usa la zona que manda la app
        # (configuración del reloj de cada persona). Si no llega una zona válida, se usa UTC.
        zona_pedida = (request.args.get('zona') or '').strip()
        try:
            from zoneinfo import ZoneInfo
            zona = ZoneInfo(zona_pedida) if zona_pedida else ZoneInfo('UTC')
        except Exception:
            zona = datetime.timezone.utc
        ahora_local = datetime.datetime.now(datetime.timezone.utc).astimezone(zona)
        hoy = ahora_local.date()

        medicamentos = MedicamentoProgramado.query.filter_by(
            usuario_id=usuario_actual.id, activo=True
        ).all()

        tomas_generadas = []
        for med in medicamentos:
            horarios = json.loads(med.horarios)
            for horario in horarios:
                hora, minuto = map(int, horario.split(':'))
                fecha_prog = datetime.datetime(hoy.year, hoy.month, hoy.day, hora, minuto)

                # Verificar si ya existe esta toma hoy
                existente = TomaRegistrada.query.filter_by(
                    usuario_id=usuario_actual.id,
                    medicamento_id=med.id,
                    horario_programado=horario,
                ).filter(
                    TomaRegistrada.fecha_programada >= datetime.datetime(hoy.year, hoy.month, hoy.day),
                    TomaRegistrada.fecha_programada < datetime.datetime(hoy.year, hoy.month, hoy.day) + datetime.timedelta(days=1)
                ).first()

                if not existente:
                    nueva_toma = TomaRegistrada(
                        usuario_id=usuario_actual.id,
                        medicamento_id=med.id,
                        horario_programado=horario,
                        fecha_programada=fecha_prog,
                        tomada=False,
                        omitida=False,
                    )
                    db.session.add(nueva_toma)
                    tomas_generadas.append(nueva_toma)

        if tomas_generadas:
            db.session.commit()

        # Recuperar todas las tomas de hoy ordenadas por hora
        tomas = TomaRegistrada.query.filter(
            TomaRegistrada.usuario_id == usuario_actual.id,
            TomaRegistrada.fecha_programada >= datetime.datetime(hoy.year, hoy.month, hoy.day),
            TomaRegistrada.fecha_programada < datetime.datetime(hoy.year, hoy.month, hoy.day) + datetime.timedelta(days=1)
        ).order_by(TomaRegistrada.fecha_programada.asc()).all()

        # Solo se muestran las tomas del plan vigente. Una toma vieja (horario cambiado o medicamento quitado)
        # que todavía no se registró deja de mostrarse. Las tomas ya registradas (tomadas u omitidas) se conservan.
        plan_vigente = set()
        for med in medicamentos:
            for h_plan in json.loads(med.horarios):
                plan_vigente.add((med.id, h_plan))
        tomas = [t for t in tomas if t.tomada or t.omitida or (t.medicamento_id, t.horario_programado) in plan_vigente]

        # Agrupar por horario (una entrada por bloque horario, con todos sus medicamentos)
        bloques = {}
        for t in tomas:
            h = t.horario_programado
            if h not in bloques:
                bloques[h] = {
                    'horario': h,
                    'fecha_programada': t.fecha_programada.isoformat(),
                    'tomas': [],
                    'todas_tomadas': True,
                    'alguna_omitida': False,
                }
            entrada = t.to_dict()
            # Datos del medicamento de esta toma (nombre, dosis y sustancia activa)
            med_t = next((m for m in medicamentos if m.id == t.medicamento_id), None)
            entrada['medicamento_nombre'] = med_t.nombre if med_t else None
            entrada['medicamento_dosis'] = med_t.dosis if med_t else None
            entrada['principio_activo'] = med_t.principio_activo if med_t else None
            entrada['separacion_comida_min'] = med_t.separacion_comida_min if med_t else 0
            bloques[h]['tomas'].append(entrada)
            if not t.tomada:
                bloques[h]['todas_tomadas'] = False
            if t.omitida:
                bloques[h]['alguna_omitida'] = True

        return jsonify({
            'fecha': hoy.isoformat(),
            'bloques': list(bloques.values()),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def zona_de_paciente(nombre):
    """Zona horaria que manda la app (IANA). Si no es válida, UTC."""
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(nombre) if nombre else ZoneInfo('UTC')
    except Exception:
        return datetime.timezone.utc


def validar_hora_real(txt):
    """'HH:MM' (24 h) a datetime.time. None si no es válida."""
    import re
    if not isinstance(txt, str) or not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', txt.strip()):
        return None
    hh, mm = map(int, txt.strip().split(':'))
    return datetime.time(hh, mm)


@app.route('/api/tomas/<int:toma_id>/tomar', methods=['POST'])
@token_requerido
def registrar_toma(usuario_actual, toma_id):
    """
    Marca una toma como tomada con timestamp real.
    Calcula automáticamente el desvío respecto a la hora programada.
    """
    try:
        toma = db.session.get(TomaRegistrada, toma_id)
        if not toma or toma.usuario_id != usuario_actual.id:
            return jsonify({'error': 'Toma no encontrada'}), 404

        datos = request.get_json(silent=True) or {}
        zona = zona_de_paciente(datos.get('zona'))
        # Hora real en la zona del paciente (hora de pared). Si no llega una hora, es "ahora".
        if datos.get('hora_real'):
            hora_real = validar_hora_real(datos.get('hora_real'))
            if hora_real is None:
                return jsonify({'error': 'La hora real debe tener formato HH:MM (24 horas)'}), 400
            ahora = datetime.datetime.combine(toma.fecha_programada.date(), hora_real)
        else:
            ahora = datetime.datetime.now(datetime.timezone.utc).astimezone(zona).replace(tzinfo=None)
        desvio = int((ahora - toma.fecha_programada).total_seconds() / 60)

        toma.tomada = True
        toma.omitida = False
        toma.fecha_toma_real = ahora
        toma.desvio_minutos = desvio

        if datos.get('notas'):
            toma.notas = datos['notas']

        db.session.commit()
        return jsonify({
            'mensaje': 'Toma registrada',
            'toma': toma.to_dict(),
            'desvio_minutos': desvio,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/tomas/<int:toma_id>/deshacer', methods=['POST'])
@token_requerido
def deshacer_toma(usuario_actual, toma_id):
    """Regresa una toma marcada (tomada u omitida) a pendiente. No borra el medicamento ni el historial de dosis."""
    try:
        toma = db.session.get(TomaRegistrada, toma_id)
        if not toma or toma.usuario_id != usuario_actual.id:
            return jsonify({'error': 'Toma no encontrada'}), 404
        toma.tomada = False
        toma.omitida = False
        toma.fecha_toma_real = None
        toma.desvio_minutos = None
        db.session.commit()
        return jsonify({'mensaje': 'Toma regresada a pendiente', 'toma': toma.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/tomas/<int:toma_id>/omitir', methods=['POST'])
@token_requerido
def omitir_toma(usuario_actual, toma_id):
    """Marca una toma como omitida."""
    try:
        toma = db.session.get(TomaRegistrada, toma_id)
        if not toma or toma.usuario_id != usuario_actual.id:
            return jsonify({'error': 'Toma no encontrada'}), 404

        toma.omitida = True
        toma.tomada = False
        datos = request.get_json(silent=True) or {}
        if datos.get('notas'):
            toma.notas = datos['notas']

        db.session.commit()
        return jsonify({'mensaje': 'Toma marcada como omitida', 'toma': toma.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/tomas/historial', methods=['GET'])
@token_requerido
def historial_tomas(usuario_actual):
    """
    Adherencia de los últimos N días.
    Devuelve porcentaje de cumplimiento y desvío promedio por medicamento.
    """
    try:
        dias = int(request.args.get('dias', 7))
        fecha_inicio = datetime.datetime.utcnow() - datetime.timedelta(days=dias)

        tomas = TomaRegistrada.query.filter(
            TomaRegistrada.usuario_id == usuario_actual.id,
            TomaRegistrada.fecha_programada >= fecha_inicio,
            TomaRegistrada.fecha_programada <= datetime.datetime.utcnow()
        ).order_by(TomaRegistrada.fecha_programada.asc()).all()

        total = len(tomas)
        tomadas = sum(1 for t in tomas if t.tomada)
        omitidas = sum(1 for t in tomas if t.omitida)
        pendientes = total - tomadas - omitidas

        desvios = [t.desvio_minutos for t in tomas if t.tomada and t.desvio_minutos is not None]
        desvio_promedio = round(sum(desvios) / len(desvios), 1) if desvios else 0

        return jsonify({
            'dias': dias,
            'total_programadas': total,
            'tomadas': tomadas,
            'omitidas': omitidas,
            'pendientes': pendientes,
            'adherencia_pct': round(tomadas / total * 100, 1) if total > 0 else 0,
            'desvio_promedio_min': desvio_promedio,
            'tomas': [t.to_dict() for t in tomas],
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================
# BITÁCORA DE FLUCTUACIONES (HAUSER)
# =============================================

@app.route('/api/fluctuaciones', methods=['POST'])
@token_requerido
def registrar_fluctuacion(usuario_actual):
    """
    Registra el estado motor en un bloque horario.
    estados válidos: ON | OFF | ON_DISC_LEVE | ON_DISC_GRAVE | DORMIDO
    """
    try:
        datos = request.get_json()
        estado = datos.get('estado', '').upper()
        estados_validos = {'ON', 'OFF', 'ON_DISC_LEVE', 'ON_DISC_GRAVE', 'DORMIDO'}

        if estado not in estados_validos:
            return jsonify({'error': f'Estado inválido. Usa: {", ".join(estados_validos)}'}), 400

        hora_bloque = datos.get('hora_bloque')  # "08:00"
        fecha_str = datos.get('fecha')           # "2026-10-08" o None → hoy

        if fecha_str:
            fecha = datetime.datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = datetime.datetime.utcnow().date()

        if not hora_bloque:
            # Calcular bloque de 30 min actual
            ahora = datetime.datetime.utcnow()
            minuto_redondeado = 0 if ahora.minute < 30 else 30
            hora_bloque = f'{ahora.hour:02d}:{minuto_redondeado:02d}'

        # Upsert: si ya existe ese bloque ese día, actualizar
        existente = FluctuacionMotora.query.filter_by(
            usuario_id=usuario_actual.id,
            fecha=fecha,
            hora_bloque=hora_bloque
        ).first()

        if existente:
            existente.estado = estado
            existente.notas = datos.get('notas', existente.notas)
        else:
            nueva = FluctuacionMotora(
                usuario_id=usuario_actual.id,
                fecha=fecha,
                hora_bloque=hora_bloque,
                estado=estado,
                notas=datos.get('notas'),
            )
            db.session.add(nueva)

        db.session.commit()
        return jsonify({'mensaje': 'Estado motor registrado', 'hora_bloque': hora_bloque, 'estado': estado}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/fluctuaciones', methods=['GET'])
@token_requerido
def listar_fluctuaciones(usuario_actual):
    """Devuelve la bitácora de fluctuaciones de los últimos N días."""
    try:
        dias = int(request.args.get('dias', 7))
        fecha_inicio = datetime.datetime.utcnow().date() - datetime.timedelta(days=dias)

        registros = FluctuacionMotora.query.filter(
            FluctuacionMotora.usuario_id == usuario_actual.id,
            FluctuacionMotora.fecha >= fecha_inicio
        ).order_by(FluctuacionMotora.fecha.asc(), FluctuacionMotora.hora_bloque.asc()).all()

        # Agrupar por fecha
        por_fecha = {}
        conteo_estados = {'ON': 0, 'OFF': 0, 'ON_DISC_LEVE': 0, 'ON_DISC_GRAVE': 0, 'DORMIDO': 0}

        for r in registros:
            d = r.fecha.isoformat()
            if d not in por_fecha:
                por_fecha[d] = []
            por_fecha[d].append(r.to_dict())
            conteo_estados[r.estado] = conteo_estados.get(r.estado, 0) + 1

        return jsonify({
            'dias': dias,
            'por_fecha': por_fecha,
            'resumen_estados': conteo_estados,
            'total_bloques': len(registros),
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================
# ENDPOINTS: REGISTRO DIARIO (síntomas no motores)
# =============================================

@app.route('/api/registro-diario', methods=['POST'])
@token_requerido
def crear_registro_diario(usuario_actual):
    """
    Crea o actualiza el registro diario de síntomas no motores.
    Si ya existe un registro para hoy, lo actualiza (upsert).
    Escala 0-4: 0=sin problema, 4=muy grave.
    """
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se recibieron datos'}), 400

        # Fecha: hoy por defecto, o la que viene en el payload
        if 'fecha' in datos:
            from datetime import date
            fecha = date.fromisoformat(datos['fecha'])
        else:
            fecha = datetime.datetime.utcnow().date()

        # Buscar si ya existe un registro para ese día
        registro = RegistroDiario.query.filter_by(
            usuario_id=usuario_actual.id,
            fecha=fecha
        ).first()

        campos = ['energia', 'calidad_sueno', 'somnolencia', 'animo',
                  'ansiedad', 'digestion', 'nauseas', 'dolor', 'apetito', 'nota_dia']

        if registro:
            # Actualizar campos que vienen en el payload
            for campo in campos:
                if campo in datos:
                    setattr(registro, campo, datos[campo])
            registro.fecha_registro = datetime.datetime.utcnow()
        else:
            registro = RegistroDiario(
                usuario_id=usuario_actual.id,
                fecha=fecha,
            )
            for campo in campos:
                if campo in datos:
                    setattr(registro, campo, datos[campo])
            db.session.add(registro)

        db.session.commit()
        return jsonify(registro.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/registro-diario/hoy', methods=['GET'])
@token_requerido
def registro_diario_hoy(usuario_actual):
    """Devuelve el registro de hoy, o null si no existe."""
    try:
        hoy = datetime.datetime.utcnow().date()
        registro = RegistroDiario.query.filter_by(
            usuario_id=usuario_actual.id,
            fecha=hoy
        ).first()
        if registro:
            return jsonify(registro.to_dict()), 200
        return jsonify(None), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/registro-diario/historial', methods=['GET'])
@token_requerido
def historial_registro_diario(usuario_actual):
    """
    Últimos N días de registros diarios.
    Query param: dias (default 14)
    """
    try:
        dias = int(request.args.get('dias', 14))
        desde = datetime.datetime.utcnow().date() - datetime.timedelta(days=dias)
        registros = RegistroDiario.query.filter(
            RegistroDiario.usuario_id == usuario_actual.id,
            RegistroDiario.fecha >= desde
        ).order_by(RegistroDiario.fecha.desc()).all()
        return jsonify([r.to_dict() for r in registros]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reporte', methods=['GET'])
@token_requerido
def generar_reporte(usuario_actual):
    """
    Endpoint de reporte consolidado para el neurólogo.
    Devuelve un JSON con síntomas, adherencia, estado motor y registros diarios
    de los últimos N días (default 30).
    """
    try:
        dias = int(request.args.get('dias', 30))
        desde = datetime.datetime.utcnow().date() - datetime.timedelta(days=dias)
        desde_dt = datetime.datetime(desde.year, desde.month, desde.day)

        # 1. Síntomas motores registrados
        sintomas = Sintoma.query.filter(
            Sintoma.usuario_id == usuario_actual.id,
            Sintoma.fecha_registro >= desde_dt
        ).order_by(Sintoma.fecha_registro.desc()).all()

        # 2. Adherencia a medicamentos
        tomas = TomaRegistrada.query.filter(
            TomaRegistrada.usuario_id == usuario_actual.id,
            TomaRegistrada.fecha_programada >= desde_dt
        ).all()

        total_tomas = len([t for t in tomas if not t.omitida or t.tomada])
        tomas_tomadas = len([t for t in tomas if t.tomada])
        tomas_omitidas = len([t for t in tomas if t.omitida and not t.tomada])
        adherencia_pct = round((tomas_tomadas / total_tomas * 100) if total_tomas > 0 else 0)

        # 3. Estado motor (fluctuaciones ON/OFF) — últimos N días
        fluctuaciones = FluctuacionMotora.query.filter(
            FluctuacionMotora.usuario_id == usuario_actual.id,
            FluctuacionMotora.fecha >= desde
        ).all()

        conteo_estados = {'ON': 0, 'OFF': 0, 'ON_DISC_LEVE': 0, 'ON_DISC_GRAVE': 0, 'DORMIDO': 0}
        for f in fluctuaciones:
            if f.estado in conteo_estados:
                conteo_estados[f.estado] += 1

        # Convertir a horas (bloques de 30 min = 0.5h)
        horas_estados = {k: round(v * 0.5, 1) for k, v in conteo_estados.items()}

        # 4. Registros diarios (síntomas no motores)
        registros_diarios = RegistroDiario.query.filter(
            RegistroDiario.usuario_id == usuario_actual.id,
            RegistroDiario.fecha >= desde
        ).order_by(RegistroDiario.fecha.asc()).all()

        # Promedios de registros diarios
        campos_no_motor = ['energia', 'calidad_sueno', 'somnolencia', 'animo',
                           'ansiedad', 'digestion', 'nauseas', 'dolor', 'apetito']
        promedios_no_motor = {}
        for campo in campos_no_motor:
            valores = [getattr(r, campo) for r in registros_diarios if getattr(r, campo) is not None]
            promedios_no_motor[campo] = round(sum(valores) / len(valores), 1) if valores else None

        # 5. Síntomas más frecuentes
        from collections import Counter
        tipo_counter = Counter([s.tipo for s in sintomas])
        sintomas_frecuentes = [{'tipo': t, 'conteo': c} for t, c in tipo_counter.most_common(5)]

        # 6. Cambios de zona horaria (manual o automático) en el período, para interpretar fluctuaciones
        from sqlalchemy import text
        # Se ordena por la hora real (UTC). Cada cambio se muestra en la zona nueva del paciente.
        filas_zona = db.session.execute(text("""
            SELECT fecha_utc, zona_anterior, zona_nueva, offset_nuevo, tipo
            FROM cambios_zona_horaria
            WHERE usuario_id = :u AND fecha_utc >= :d
            ORDER BY fecha_utc
        """), {'u': usuario_actual.id, 'd': desde_dt}).fetchall()
        cambios_zona = []
        for f in filas_zona:
            try:
                from zoneinfo import ZoneInfo
                local = f[0].replace(tzinfo=datetime.timezone.utc).astimezone(ZoneInfo(f[2]))
                hora_mostrada = local.replace(tzinfo=None).isoformat()
            except Exception:
                hora_mostrada = f[0].isoformat()
            cambios_zona.append({'fecha_local': hora_mostrada, 'zona_anterior': f[1], 'zona_nueva': f[2],
                                 'offset_nuevo': f[3], 'tipo': f[4]})

        return jsonify({
            'paciente': {
                'nombre': usuario_actual.nombre,
                'email': usuario_actual.email,
            },
            'periodo': {
                'dias': dias,
                'desde': desde.isoformat(),
                'hasta': datetime.datetime.utcnow().date().isoformat(),
            },
            'adherencia': {
                'total_programadas': total_tomas,
                'tomadas': tomas_tomadas,
                'omitidas': tomas_omitidas,
                'porcentaje': adherencia_pct,
            },
            'estado_motor': {
                'total_bloques': len(fluctuaciones),
                'conteo': conteo_estados,
                'horas': horas_estados,
            },
            'sintomas_motores': {
                'total': len(sintomas),
                'frecuentes': sintomas_frecuentes,
                'registros': [s.to_dict() for s in sintomas[:20]],  # últimos 20
            },
            'no_motor': {
                'dias_registrados': len(registros_diarios),
                'promedios': promedios_no_motor,
                'registros': [r.to_dict() for r in registros_diarios],
            },
            'cambios_zona': cambios_zona,
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/zona/cambio', methods=['POST'])
@token_requerido
def registrar_cambio_zona(usuario_actual):
    """
    Registra un cambio de zona horaria. tipo = 'manual' (lo eligió el paciente en Configuración)
    o 'automatico' (cambió el reloj del dispositivo). La hora y el desfase UTC los calcula el servidor.
    """
    from sqlalchemy import text
    data = request.get_json(silent=True) or {}
    zona_nueva = (data.get('zona_nueva') or '').strip()
    zona_anterior = (data.get('zona_anterior') or '').strip()[:60] or None
    tipo = data.get('tipo')
    if tipo not in ('manual', 'automatico'):
        return jsonify({'error': 'tipo debe ser manual o automatico'}), 400
    if not zona_nueva or len(zona_nueva) > 60:
        return jsonify({'error': 'Zona horaria no válida'}), 400
    try:
        from zoneinfo import ZoneInfo
        zona = ZoneInfo(zona_nueva)
    except Exception:
        return jsonify({'error': 'Zona horaria no válida'}), 400

    ahora_utc = datetime.datetime.now(datetime.timezone.utc)
    ahora_zona = ahora_utc.astimezone(zona)
    minutos = int(ahora_zona.utcoffset().total_seconds() // 60)
    signo = '+' if minutos >= 0 else '-'
    offset = f"UTC{signo}{abs(minutos) // 60:02d}:{abs(minutos) % 60:02d}"
    try:
        db.session.execute(text("""
            INSERT INTO cambios_zona_horaria (usuario_id, fecha_utc, fecha_local, zona_anterior, zona_nueva, offset_nuevo, tipo)
            VALUES (:u, :fu, :f, :za, :zn, :o, :t)
        """), {'u': usuario_actual.id, 'fu': ahora_utc.replace(tzinfo=None), 'f': ahora_zona.replace(tzinfo=None),
               'za': zona_anterior, 'zn': zona_nueva, 'o': offset, 't': tipo})
        db.session.commit()
        return jsonify({'ok': True, 'offset_nuevo': offset}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Endpoint de salud que verifica la conexión a la base de datos y el entorno."""
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
