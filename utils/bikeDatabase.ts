export interface BikeModel {
    id: string; // unique key e.g. "yamaha-r1"
    brand: string;
    model: string;
    years: string[];
    type: 'Sport' | 'Naked' | 'Adventure' | 'Touring' | 'Offroad' | 'Cruiser' | 'Scooter';
}

export const BIKE_DATABASE: BikeModel[] = [
    // --- APRILIA ---
    { id: 'aprilia-rs660', brand: 'Aprilia', model: 'RS 660', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'aprilia-tuono660', brand: 'Aprilia', model: 'Tuono 660', years: ['2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'aprilia-rsv4', brand: 'Aprilia', model: 'RSV4 1100 Factory', years: ['2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'aprilia-tuonov4', brand: 'Aprilia', model: 'Tuono V4 1100', years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'aprilia-rs457', brand: 'Aprilia', model: 'RS 457', years: ['2024'], type: 'Sport' },
    { id: 'aprilia-tuareg660', brand: 'Aprilia', model: 'Tuareg 660', years: ['2022', '2023', '2024'], type: 'Adventure' },

    // --- BMW ---
    { id: 'bmw-s1000rr', brand: 'BMW', model: 'S 1000 RR', years: ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'bmw-m1000rr', brand: 'BMW', model: 'M 1000 RR', years: ['2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'bmw-s1000r', brand: 'BMW', model: 'S 1000 R', years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'bmw-m1000r', brand: 'BMW', model: 'M 1000 R', years: ['2023', '2024'], type: 'Naked' },
    { id: 'bmw-r1250gs', brand: 'BMW', model: 'R 1250 GS', years: ['2019', '2020', '2021', '2022', '2023', '2024'], type: 'Adventure' },
    { id: 'bmw-r1300gs', brand: 'BMW', model: 'R 1300 GS', years: ['2024'], type: 'Adventure' },
    { id: 'bmw-f900r', brand: 'BMW', model: 'F 900 R', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'bmw-f900xr', brand: 'BMW', model: 'F 900 XR', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Adventure' },

    // --- DUCATI ---
    { id: 'ducati-panigalev4', brand: 'Ducati', model: 'Panigale V4/S', years: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'ducati-panigalev2', brand: 'Ducati', model: 'Panigale V2', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'ducati-sfv4', brand: 'Ducati', model: 'Streetfighter V4/S', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'ducati-sfv2', brand: 'Ducati', model: 'Streetfighter V2', years: ['2022', '2023', '2024'], type: 'Naked' },
    { id: 'ducati-monster937', brand: 'Ducati', model: 'Monster 937', years: ['2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'ducati-multistradav4', brand: 'Ducati', model: 'Multistrada V4', years: ['2021', '2022', '2023', '2024'], type: 'Adventure' },
    { id: 'ducati-hypermotard950', brand: 'Ducati', model: 'Hypermotard 950', years: ['2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },

    // --- HONDA ---
    { id: 'honda-cbr1000rrr', brand: 'Honda', model: 'CBR1000RR-R Fireblade', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'honda-cbr650r', brand: 'Honda', model: 'CBR650R', years: ['2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'honda-cb650r', brand: 'Honda', model: 'CB650R', years: ['2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'honda-cb750', brand: 'Honda', model: 'CB750 Hornet', years: ['2023', '2024'], type: 'Naked' },
    { id: 'honda-xl750', brand: 'Honda', model: 'XL750 Transalp', years: ['2023', '2024'], type: 'Adventure' },
    { id: 'honda-crf1100', brand: 'Honda', model: 'Africa Twin CRF1100L', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Adventure' },
    { id: 'honda-cbr500r', brand: 'Honda', model: 'CBR500R', years: ['2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'honda-cbr600rr', brand: 'Honda', model: 'CBR600RR', years: ['2024', '2003-2016'], type: 'Sport' }, // Reintroduced in 2024

    // --- KAWASAKI ---
    { id: 'kawasaki-zx10r', brand: 'Kawasaki', model: 'Ninja ZX-10R', years: ['2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'kawasaki-zx6r', brand: 'Kawasaki', model: 'Ninja ZX-6R', years: ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'kawasaki-z900', brand: 'Kawasaki', model: 'Z900', years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'kawasaki-z650', brand: 'Kawasaki', model: 'Z650', years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'kawasaki-ninja400', brand: 'Kawasaki', model: 'Ninja 400', years: ['2018', '2019', '2020', '2021', '2022', '2023'], type: 'Sport' },
    { id: 'kawasaki-ninja500', brand: 'Kawasaki', model: 'Ninja 500', years: ['2024'], type: 'Sport' },
    { id: 'kawasaki-zh2', brand: 'Kawasaki', model: 'Z H2', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Naked' },

    // --- KTM ---
    { id: 'ktm-duke390', brand: 'KTM', model: '390 Duke', years: ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'ktm-duke790', brand: 'KTM', model: '790 Duke', years: ['2018', '2019', '2020', '2023', '2024'], type: 'Naked' },
    { id: 'ktm-duke890', brand: 'KTM', model: '890 Duke R/GP', years: ['2020', '2021', '2022', '2023'], type: 'Naked' },
    { id: 'ktm-duke990', brand: 'KTM', model: '990 Duke', years: ['2024'], type: 'Naked' },
    { id: 'ktm-sdr1290', brand: 'KTM', model: '1290 Super Duke R', years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'], type: 'Naked' },
    { id: 'ktm-sdr1390', brand: 'KTM', model: '1390 Super Duke R', years: ['2024'], type: 'Naked' },
    { id: 'ktm-adv1290', brand: 'KTM', model: '1290 Super Adventure', years: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Adventure' },

    // --- YAMAHA ---
    { id: 'yamaha-r1', brand: 'Yamaha', model: 'YZF-R1', years: ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'yamaha-r6', brand: 'Yamaha', model: 'YZF-R6', years: ['2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'], type: 'Sport' },
    { id: 'yamaha-r7', brand: 'Yamaha', model: 'YZF-R7', years: ['2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'yamaha-r9', brand: 'Yamaha', model: 'YZF-R9', years: ['2025'], type: 'Sport' }, // Anticipating
    { id: 'yamaha-mt07', brand: 'Yamaha', model: 'MT-07', years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'yamaha-mt09', brand: 'Yamaha', model: 'MT-09', years: ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'yamaha-mt10', brand: 'Yamaha', model: 'MT-10', years: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'yamaha-tenere700', brand: 'Yamaha', model: 'Tenere 700', years: ['2019', '2020', '2021', '2022', '2023', '2024'], type: 'Adventure' },
    { id: 'yamaha-tmax', brand: 'Yamaha', model: 'TMAX 560', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Scooter' },

    // --- SUZUKI ---
    { id: 'suzuki-gsxr1000', brand: 'Suzuki', model: 'GSX-R1000', years: ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Sport' },
    { id: 'suzuki-gsxs1000', brand: 'Suzuki', model: 'GSX-S1000', years: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'suzuki-gsx8s', brand: 'Suzuki', model: 'GSX-8S', years: ['2023', '2024'], type: 'Naked' },
    { id: 'suzuki-vstrom800', brand: 'Suzuki', model: 'V-Strom 800DE', years: ['2023', '2024'], type: 'Adventure' },
    { id: 'suzuki-hayabusa', brand: 'Suzuki', model: 'Hayabusa', years: ['2008-2020', '2021', '2022', '2023', '2024'], type: 'Sport' },

    // --- TRIUMPH ---
    { id: 'triumph-street765', brand: 'Triumph', model: 'Street Triple 765', years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'triumph-speed1200', brand: 'Triumph', model: 'Speed Triple 1200 RS', years: ['2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'triumph-trident660', brand: 'Triumph', model: 'Trident 660', years: ['2021', '2022', '2023', '2024'], type: 'Naked' },
    { id: 'triumph-tiger900', brand: 'Triumph', model: 'Tiger 900', years: ['2020', '2021', '2022', '2023', '2024'], type: 'Adventure' },

    // --- MV AGUSTA ---
    { id: 'mv-f3', brand: 'MV Agusta', model: 'F3 800', years: ['2013-2024'], type: 'Sport' },
    { id: 'mv-brutale800', brand: 'MV Agusta', model: 'Brutale 800rr', years: ['2016-2024'], type: 'Naked' },
    { id: 'mv-dragster800', brand: 'MV Agusta', model: 'Dragster 800rr', years: ['2016-2024'], type: 'Naked' }
];

// Helper para obtener marcas únicas
export const getAllBrands = () => Array.from(new Set(BIKE_DATABASE.map(b => b.brand))).sort();

// Helper para obtener modelos por marca
export const getModelsByBrand = (brand: string) => BIKE_DATABASE.filter(b => b.brand === brand).map(b => b.model).sort();

// Helper para obtener años por modelo
export const getYearsByModel = (model: string) => {
    const bike = BIKE_DATABASE.find(b => b.model === model);
    return bike ? bike.years : [];
};
