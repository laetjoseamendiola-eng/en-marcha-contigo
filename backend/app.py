from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from collections import Counter

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.now)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<Usuario {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'fecha_registro': self.fecha_registro.isoformat()
        }

class Sintoma(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    intensidad = db.Column(db.Integer, default=0)
    duracion = db.Column(db.Integer, default=0)
    localizacion = db.Column(db.String(100))
    notas = db.Column(db.Text)
    fecha_registro = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f'<Sintoma {self.tipo} - {self.intensidad}/10>'

    def to_dict(self):
        return {
            'id': self.id,
            'tipo': self.tipo,
            'intensidad': self.intensidad,
            'duracion': self.duracion,
            'localizacion': self.localizacion,
            'notas': self.notas,
            'fecha_registro': self.fecha_registro.isoformat()
        }

with app.app_context():
    db.create_all()
    print('✅ Base de datos inicializada')

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        datos = request.get_json()
        nombre = datos.get('nombre')
        email = datos.get('email')
        password = datos.get('password')

        if not nombre or not email or not password:
            return jsonify({'status': 'error', 'message': 'Nombre, email y contraseña requeridos'}), 400

        if Usuario.query.filter_by(email=email).first():
            return jsonify({'status': 'error', 'message': 'Email ya registrado'}), 400

        nuevo_usuario = Usuario(nombre=nombre, email=email)
        nuevo_usuario.set_password(password)

        db.session.add(nuevo_usuario)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Usuario registrado exitosamente',
            'usuario': nuevo_usuario.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        datos = request.get_json()
        email = datos.get('email')
        password = datos.get('password')

        if not email or not password:
            return jsonify({'status': 'error', 'message': 'Email y contraseña requeridos'}), 400

        usuario = Usuario.query.filter_by(email=email).first()

        if not usuario or not usuario.check_password(password):
            return jsonify({'status': 'error', 'message': 'Email o contraseña incorrectos'}), 401

        return jsonify({
            'status': 'success',
            'message': 'Inicio de sesión exitoso',
            'usuario': usuario.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({
        'status': 'success',
        'message': 'Sesión cerrada'
    }), 200

@app.route('/api/sintomas', methods=['POST'])
def registrar_sintoma():
    try:
        datos = request.get_json()
        usuario_id = datos.get('usuario_id')

        if not usuario_id:
            return jsonify({'status': 'error', 'message': 'usuario_id requerido'}), 400

        if not datos.get('tipo'):
            return jsonify({'status': 'error', 'message': 'tipo de síntoma requerido'}), 400

        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'status': 'error', 'message': 'usuario no encontrado'}), 404

        nuevo_sintoma = Sintoma(
            usuario_id=usuario_id,
            tipo=datos.get('tipo'),
            intensidad=datos.get('intensidad', 0),
            duracion=datos.get('duracion', 0),
            localizacion=datos.get('localizacion'),
            notas=datos.get('notas')
        )

        db.session.add(nuevo_sintoma)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Síntoma registrado exitosamente',
            'sintoma': nuevo_sintoma.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/sintomas/<int:usuario_id>', methods=['GET'])
def obtener_sintomas(usuario_id):
    try:
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'status': 'error', 'message': 'usuario no encontrado'}), 404

        sintomas = Sintoma.query.filter_by(usuario_id=usuario_id).order_by(
            Sintoma.fecha_registro.desc()
        ).all()

        return jsonify({
            'status': 'success',
            'total': len(sintomas),
            'sintomas': [s.to_dict() for s in sintomas]
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/sintomas/detalle/<int:sintoma_id>', methods=['GET'])
def obtener_sintoma(sintoma_id):
    try:
        sintoma = Sintoma.query.get(sintoma_id)
        if not sintoma:
            return jsonify({'status': 'error', 'message': 'síntoma no encontrado'}), 404

        return jsonify({
            'status': 'success',
            'sintoma': sintoma.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/sintomas/<int:sintoma_id>', methods=['PUT'])
def actualizar_sintoma(sintoma_id):
    try:
        sintoma = Sintoma.query.get(sintoma_id)
        if not sintoma:
            return jsonify({'status': 'error', 'message': 'síntoma no encontrado'}), 404

        datos = request.get_json()

        if 'tipo' in datos:
            sintoma.tipo = datos['tipo']
        if 'intensidad' in datos:
            sintoma.intensidad = datos['intensidad']
        if 'duracion' in datos:
            sintoma.duracion = datos['duracion']
        if 'localizacion' in datos:
            sintoma.localizacion = datos['localizacion']
        if 'notas' in datos:
            sintoma.notas = datos['notas']

        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Síntoma actualizado',
            'sintoma': sintoma.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/sintomas/<int:sintoma_id>', methods=['DELETE'])
def eliminar_sintoma(sintoma_id):
    try:
        sintoma = Sintoma.query.get(sintoma_id)
        if not sintoma:
            return jsonify({'status': 'error', 'message': 'síntoma no encontrado'}), 404

        db.session.delete(sintoma)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Síntoma eliminado'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/sintomas/stats/<int:usuario_id>', methods=['GET'])
def stats_sintomas(usuario_id):
    try:
        sintomas = Sintoma.query.filter_by(usuario_id=usuario_id).all()

        if not sintomas:
            return jsonify({
                'status': 'success',
                'total': 0,
                'promedio_intensidad': 0,
                'sintomas_frecuentes': []
            }), 200

        intensidad_promedio = sum(s.intensidad for s in sintomas) / len(sintomas)

        tipos = [s.tipo for s in sintomas]
        frecuentes = Counter(tipos).most_common(5)

        return jsonify({
            'status': 'success',
            'total': len(sintomas),
            'promedio_intensidad': round(intensidad_promedio, 2),
            'sintomas_frecuentes': [{'tipo': tipo, 'count': count} for tipo, count in frecuentes]
        }), 200

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    print('🚀 En Marcha Contigo Backend iniciado')
    print('📍 http://localhost:5000')
    app.run(debug=True, host='0.0.0.0', port=5000)