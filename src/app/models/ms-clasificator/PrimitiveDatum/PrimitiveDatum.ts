export interface PrimitiveDatum {
    id?: number;
    name: string;
    type: PrimitiveDatumType;
    unit?: PrimitiveUnit;
}

export enum PrimitiveDatumType {
    STRING   = 'STRING',
    INTEGER  = 'INTEGER',
    DOUBLE   = 'DOUBLE',
    BOOLEAN  = 'BOOLEAN',
    DATE     = 'DATE',
    DATETIME = 'DATETIME',
    TIME     = 'TIME',
    BINARY   = 'BINARY',
    TEXT     = 'TEXT',
}

export enum PrimitiveUnit {
    // Sin unidad
    NONE                    = 'NONE',

    // Peso
    KILOGRAM                = 'KILOGRAM',
    GRAM                    = 'GRAM',
    MILLIGRAM               = 'MILLIGRAM',
    MICROGRAM               = 'MICROGRAM',

    // Volumen
    LITER                   = 'LITER',
    MILLILITER              = 'MILLILITER',

    // Longitud
    METER                   = 'METER',
    CENTIMETER              = 'CENTIMETER',
    MILLIMETER              = 'MILLIMETER',

    // Temperatura
    CELSIUS                 = 'CELSIUS',
    FAHRENHEIT              = 'FAHRENHEIT',

    // Presión
    MMHG                    = 'MMHG',

    // Frecuencia
    BPM                     = 'BPM',
    RESPIRATIONS_PER_MINUTE = 'RESPIRATIONS_PER_MINUTE',

    // Saturación
    PERCENT                 = 'PERCENT',

    // Tiempo
    SECOND                  = 'SECOND',
    MINUTE                  = 'MINUTE',
    HOUR                    = 'HOUR',
    DAY                     = 'DAY',

    // Glucosa
    MG_DL                   = 'MG_DL',
    MMOL_L                  = 'MMOL_L',

    // Dosis
    UNIT                    = 'UNIT',
    INTERNATIONAL_UNIT      = 'INTERNATIONAL_UNIT',

    // Índices clínicos
    KG_M2                   = 'KG_M2',
}
