from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)

# En Vercel el filesystem del deployment es de solo lectura; /tmp sí es escribible.
# NOTA: /tmp no persiste de forma garantizada entre invocaciones (serverless).
# Esto es suficiente para probar la función ahora; para persistencia real
# se necesita una base de datos hospedada (Postgres/MySQL) más adelante.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class Sintoma(db.Model):
    __tablename__ = 'sintomas'

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    intensidad = db.Column(db.Integer, nullable=False)
    duracion = db.Column(db.Integer, nullable=False)
    localizacion = db.Column(db.String(100), nullable=False)
    notas = db.Column(db.Text)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

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


with app.app_context():
    db.create_all()


@app.route('/api/sintomas', methods=['POST'])
def crear_sintoma():
    try:
        data = request.get_json()

        if not data.get('usuario_id'):
            return jsonify({'error': 'usuario_id es requerido'}), 400
        if not data.get('tipo'):
            return jsonify({'error': 'tipo es requerido'}), 400
        if not isinstance(data.get('intensidad'), int) or data['intensidad'] < 1 or data['intensidad'] > 5:
            return jsonify({'error': 'intensidad debe ser un número entre 1 y 5'}), 400
        if not data.get('duracion') or data['duracion'] < 1:
            return jsonify({'error': 'duracion debe ser mayor a 0'}), 400
        if not data.get('localizacion'):
            return jsonify({'error': 'localizacion es requerida'}), 400

        sintoma = Sintoma(
            usuario_id=data['usuario_id'],
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


@app.route('/api/sintomas/<int:usuario_id>', methods=['GET'])
def obtener_sintomas(usuario_id):
    try:
        sintomas = Sintoma.query.filter_by(usuario_id=usuario_id).order_by(Sintoma.fecha_registro.desc()).all()
        return jsonify([s.to_dict() for s in sintomas]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas/detalle/<int:sintoma_id>', methods=['GET'])
def obtener_sintoma(sintoma_id):
    try:
        sintoma = Sintoma.query.get(sintoma_id)
        if not sintoma:
            return jsonify({'error': 'Síntoma no encontrado'}), 404
        return jsonify(sintoma.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas/<int:sintoma_id>', methods=['PUT'])
def actualizar_sintoma(sintoma_id):
    try:
        sintoma = Sintoma.query.get(sintoma_id)
        if not sintoma:
            return jsonify({'error': 'Síntoma no encontrado'}), 404

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
def eliminar_sintoma(sintoma_id):
    try:
        sintoma = Sintoma.query.get(sintoma_id)
        if not sintoma:
            return jsonify({'error': 'Síntoma no encontrado'}), 404

        db.session.delete(sintoma)
        db.session.commit()

        return jsonify({'mensaje': 'Síntoma eliminado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/sintomas/stats/<int:usuario_id>', methods=['GET'])
def estadisticas_sintomas(usuario_id):
    try:
        sintomas = Sintoma.query.filter_by(usuario_id=usuario_id).all()

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
    return jsonify({'status': 'ok'}), 200
