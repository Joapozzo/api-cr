const { query } = require("../../utils/db");

const esPartidoVuelta = async (id_partido, id_zona) => {
    try {
        const getZoneTypeQuery = 'SELECT tipo_zona FROM zonas WHERE id_zona = ?';
        const results = await query(getZoneTypeQuery, [id_zona]);

        console.log('Resultado tipo_zona:', results);

        if (results.length > 0) {
            let tipoZona = results[0].tipo_zona;
            console.log('Tipo de zona:', tipoZona);

            tipoZona = tipoZona.trim();
            console.log('Tipo de zona después de trim():', tipoZona);

            if (tipoZona === 'eliminacion-directa-ida-vuelta') {
                console.log('Zona es de tipo "eliminacion-directa-ida-vuelta"');

                const checkIfReturnMatchQuery = 'SELECT vuelta FROM partidos WHERE id_partido = ? AND id_zona = ? AND vuelta = ?';
                const matchResults = await query(checkIfReturnMatchQuery, [id_partido, id_zona, id_partido]);

                console.log('Resultado partido de vuelta:', matchResults);

                if (matchResults.length > 0) {
                    console.log('Es un partido de vuelta');
                    return true;
                } else {
                    console.log('No es un partido de vuelta');
                    return false;
                }
            } else {
                console.log('La zona no es "eliminacion-directa-ida-vuelta"');
                return false;
            }
        } else {
            console.log('No se encontró zona con ese ID');
            return false;
        }
    } catch (err) {
        console.error('Error al verificar si es partido de vuelta:', err);
        return false;
    }
};

module.exports = { esPartidoVuelta };
