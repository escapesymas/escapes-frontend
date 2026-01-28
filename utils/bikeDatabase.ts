export interface BikeModel {
    id: string;
    brand: string;
    model: string;
    years: string[];
    type: 'Sport' | 'Naked' | 'Adventure' | 'Touring' | 'Offroad' | 'Cruiser' | 'Scooter';
}

export const BIKE_DATABASE: BikeModel[] = [
    // ==========================================
    //                 APRILIA
    // ==========================================
    { id: 'aprilia-rs125', brand: 'Aprilia', model: 'RS 125', years: ['2017-2024'], type: 'Sport' },
    { id: 'aprilia-tuono125', brand: 'Aprilia', model: 'Tuono 125', years: ['2017-2024'], type: 'Naked' },
    { id: 'aprilia-rs457', brand: 'Aprilia', model: 'RS 457', years: ['2024'], type: 'Sport' },
    { id: 'aprilia-rs660', brand: 'Aprilia', model: 'RS 660', years: ['2020-2024'], type: 'Sport' },
    { id: 'aprilia-tuono660', brand: 'Aprilia', model: 'Tuono 660', years: ['2021-2024'], type: 'Naked' },
    { id: 'aprilia-tuareg660', brand: 'Aprilia', model: 'Tuareg 660', years: ['2022-2024'], type: 'Adventure' },
    { id: 'aprilia-shiver900', brand: 'Aprilia', model: 'Shiver 900', years: ['2017-2021'], type: 'Naked' },
    { id: 'aprilia-dorsoduro900', brand: 'Aprilia', model: 'Dorsoduro 900', years: ['2017-2021'], type: 'Naked' },
    { id: 'aprilia-rsv4', brand: 'Aprilia', model: 'RSV4 1100 Factory', years: ['2019-2024'], type: 'Sport' },
    { id: 'aprilia-tuonov4', brand: 'Aprilia', model: 'Tuono V4 1100', years: ['2017-2024'], type: 'Naked' },

    // ==========================================
    //                   BMW
    // ==========================================
    { id: 'bmw-g310r', brand: 'BMW', model: 'G 310 R', years: ['2016-2024'], type: 'Naked' },
    { id: 'bmw-g310gs', brand: 'BMW', model: 'G 310 GS', years: ['2017-2024'], type: 'Adventure' },
    { id: 'bmw-f750gs', brand: 'BMW', model: 'F 750 GS', years: ['2018-2024'], type: 'Adventure' },
    { id: 'bmw-f850gs', brand: 'BMW', model: 'F 850 GS', years: ['2018-2024'], type: 'Adventure' },
    { id: 'bmw-f900r', brand: 'BMW', model: 'F 900 R', years: ['2020-2024'], type: 'Naked' },
    { id: 'bmw-f900xr', brand: 'BMW', model: 'F 900 XR', years: ['2020-2024'], type: 'Adventure' },
    { id: 'bmw-f900gs', brand: 'BMW', model: 'F 900 GS', years: ['2024'], type: 'Adventure' },
    { id: 'bmw-r1250gs', brand: 'BMW', model: 'R 1250 GS', years: ['2019-2024'], type: 'Adventure' },
    { id: 'bmw-r1250r', brand: 'BMW', model: 'R 1250 R', years: ['2019-2024'], type: 'Naked' },
    { id: 'bmw-r1250rs', brand: 'BMW', model: 'R 1250 RS', years: ['2019-2024'], type: 'Touring' },
    { id: 'bmw-r1250rt', brand: 'BMW', model: 'R 1250 RT', years: ['2019-2024'], type: 'Touring' },
    { id: 'bmw-r1300gs', brand: 'BMW', model: 'R 1300 GS', years: ['2024'], type: 'Adventure' },
    { id: 'bmw-rnineT', brand: 'BMW', model: 'R nineT', years: ['2014-2023'], type: 'Naked' },
    { id: 'bmw-r12', brand: 'BMW', model: 'R 12 / nineT', years: ['2024'], type: 'Naked' },
    { id: 'bmw-s1000rr', brand: 'BMW', model: 'S 1000 RR', years: ['2010-2024'], type: 'Sport' },
    { id: 'bmw-s1000r', brand: 'BMW', model: 'S 1000 R', years: ['2014-2024'], type: 'Naked' },
    { id: 'bmw-s1000xr', brand: 'BMW', model: 'S 1000 XR', years: ['2015-2024'], type: 'Adventure' },
    { id: 'bmw-m1000rr', brand: 'BMW', model: 'M 1000 RR', years: ['2021-2024'], type: 'Sport' },
    { id: 'bmw-m1000r', brand: 'BMW', model: 'M 1000 R', years: ['2023-2024'], type: 'Naked' },
    { id: 'bmw-m1000xr', brand: 'BMW', model: 'M 1000 XR', years: ['2024'], type: 'Adventure' },

    // ==========================================
    //                 DUCATI
    // ==========================================
    { id: 'ducati-scrambler800', brand: 'Ducati', model: 'Scrambler 800', years: ['2015-2024'], type: 'Naked' },
    { id: 'ducati-monster937', brand: 'Ducati', model: 'Monster 937', years: ['2021-2024'], type: 'Naked' },
    { id: 'ducati-hypermotard950', brand: 'Ducati', model: 'Hypermotard 950', years: ['2019-2024'], type: 'Naked' },
    { id: 'ducati-hypermotard698', brand: 'Ducati', model: 'Hypermotard 698 Mono', years: ['2024'], type: 'Naked' },
    { id: 'ducati-supersport950', brand: 'Ducati', model: 'SuperSport 950', years: ['2017-2024'], type: 'Sport' },
    { id: 'ducati-multistradav2', brand: 'Ducati', model: 'Multistrada V2', years: ['2022-2024'], type: 'Adventure' },
    { id: 'ducati-multistradav4', brand: 'Ducati', model: 'Multistrada V4', years: ['2021-2024'], type: 'Adventure' },
    { id: 'ducati-panigalev2', brand: 'Ducati', model: 'Panigale V2', years: ['2020-2024'], type: 'Sport' },
    { id: 'ducati-panigalev4', brand: 'Ducati', model: 'Panigale V4', years: ['2018-2024'], type: 'Sport' },
    { id: 'ducati-sfv2', brand: 'Ducati', model: 'Streetfighter V2', years: ['2022-2024'], type: 'Naked' },
    { id: 'ducati-sfv4', brand: 'Ducati', model: 'Streetfighter V4', years: ['2020-2024'], type: 'Naked' },
    { id: 'ducati-diavelv4', brand: 'Ducati', model: 'Diavel V4', years: ['2023-2024'], type: 'Cruiser' },
    { id: 'ducati-desertx', brand: 'Ducati', model: 'DesertX', years: ['2022-2024'], type: 'Adventure' },

    // ==========================================
    //                  HONDA
    // ==========================================
    { id: 'honda-cb125r', brand: 'Honda', model: 'CB125R', years: ['2018-2024'], type: 'Naked' },
    { id: 'honda-cbr500r', brand: 'Honda', model: 'CBR500R', years: ['2013-2024'], type: 'Sport' },
    { id: 'honda-cb500f', brand: 'Honda', model: 'CB500F/Hornet 500', years: ['2013-2024'], type: 'Naked' },
    { id: 'honda-cb500x', brand: 'Honda', model: 'CB500X/NX500', years: ['2013-2024'], type: 'Adventure' },
    { id: 'honda-cbr650r', brand: 'Honda', model: 'CBR650R', years: ['2019-2024'], type: 'Sport' },
    { id: 'honda-cb650r', brand: 'Honda', model: 'CB650R', years: ['2019-2024'], type: 'Naked' },
    { id: 'honda-cbr600rr', brand: 'Honda', model: 'CBR600RR', years: ['2003-2016', '2024'], type: 'Sport' },
    { id: 'honda-cb750', brand: 'Honda', model: 'CB750 Hornet', years: ['2023-2024'], type: 'Naked' },
    { id: 'honda-xl750', brand: 'Honda', model: 'XL750 Transalp', years: ['2023-2024'], type: 'Adventure' },
    { id: 'honda-nc750x', brand: 'Honda', model: 'NC750X', years: ['2014-2024'], type: 'Adventure' },
    { id: 'honda-crf1100', brand: 'Honda', model: 'Africa Twin 1100', years: ['2020-2024'], type: 'Adventure' },
    { id: 'honda-cmx500', brand: 'Honda', model: 'Rebel 500', years: ['2017-2024'], type: 'Cruiser' },
    { id: 'honda-cmx1100', brand: 'Honda', model: 'Rebel 1100', years: ['2021-2024'], type: 'Cruiser' },
    { id: 'honda-cb1000r', brand: 'Honda', model: 'CB1000R', years: ['2008-2024'], type: 'Naked' },
    { id: 'honda-cbr1000rr', brand: 'Honda', model: 'CBR1000RR-R Fireblade', years: ['2004-2024'], type: 'Sport' },
    { id: 'honda-xadv', brand: 'Honda', model: 'X-ADV', years: ['2017-2024'], type: 'Scooter' },
    { id: 'honda-forza750', brand: 'Honda', model: 'Forza 750', years: ['2021-2024'], type: 'Scooter' },

    // ==========================================
    //                KAWASAKI
    // ==========================================
    { id: 'kawasaki-ninja125', brand: 'Kawasaki', model: 'Ninja 125', years: ['2019-2024'], type: 'Sport' },
    { id: 'kawasaki-z125', brand: 'Kawasaki', model: 'Z125', years: ['2019-2024'], type: 'Naked' },
    { id: 'kawasaki-ninja400', brand: 'Kawasaki', model: 'Ninja 400', years: ['2018-2023'], type: 'Sport' },
    { id: 'kawasaki-ninja500', brand: 'Kawasaki', model: 'Ninja 500', years: ['2024'], type: 'Sport' },
    { id: 'kawasaki-z400', brand: 'Kawasaki', model: 'Z400', years: ['2019-2023'], type: 'Naked' },
    { id: 'kawasaki-z500', brand: 'Kawasaki', model: 'Z500', years: ['2024'], type: 'Naked' },
    { id: 'kawasaki-eliminator', brand: 'Kawasaki', model: 'Eliminator 500', years: ['2024'], type: 'Cruiser' },
    { id: 'kawasaki-ninja650', brand: 'Kawasaki', model: 'Ninja 650', years: ['2017-2024'], type: 'Sport' },
    { id: 'kawasaki-z650', brand: 'Kawasaki', model: 'Z650/RS', years: ['2017-2024'], type: 'Naked' },
    { id: 'kawasaki-versys650', brand: 'Kawasaki', model: 'Versys 650', years: ['2007-2024'], type: 'Adventure' },
    { id: 'kawasaki-zx4rr', brand: 'Kawasaki', model: 'Ninja ZX-4RR', years: ['2023-2024'], type: 'Sport' },
    { id: 'kawasaki-zx6r', brand: 'Kawasaki', model: 'Ninja ZX-6R', years: ['2003-2024'], type: 'Sport' },
    { id: 'kawasaki-z900', brand: 'Kawasaki', model: 'Z900/SE/RS', years: ['2017-2024'], type: 'Naked' },
    { id: 'kawasaki-z1000', brand: 'Kawasaki', model: 'Z1000', years: ['2003-2020'], type: 'Naked' },
    { id: 'kawasaki-ninja1000sx', brand: 'Kawasaki', model: 'Ninja 1000SX', years: ['2011-2024'], type: 'Touring' },
    { id: 'kawasaki-versys1000', brand: 'Kawasaki', model: 'Versys 1000', years: ['2012-2024'], type: 'Adventure' },
    { id: 'kawasaki-zx10r', brand: 'Kawasaki', model: 'Ninja ZX-10R', years: ['2004-2024'], type: 'Sport' },
    { id: 'kawasaki-zh2', brand: 'Kawasaki', model: 'Z H2', years: ['2020-2024'], type: 'Naked' },

    // ==========================================
    //                   KTM
    // ==========================================
    { id: 'ktm-duke125', brand: 'KTM', model: '125 Duke', years: ['2011-2024'], type: 'Naked' },
    { id: 'ktm-rc125', brand: 'KTM', model: 'RC 125', years: ['2014-2024'], type: 'Sport' },
    { id: 'ktm-duke390', brand: 'KTM', model: '390 Duke', years: ['2013-2024'], type: 'Naked' },
    { id: 'ktm-rc390', brand: 'KTM', model: 'RC 390', years: ['2014-2024'], type: 'Sport' },
    { id: 'ktm-adv390', brand: 'KTM', model: '390 Adventure', years: ['2020-2024'], type: 'Adventure' },
    { id: 'ktm-duke790', brand: 'KTM', model: '790 Duke', years: ['2018-2024'], type: 'Naked' },
    { id: 'ktm-adv790', brand: 'KTM', model: '790 Adventure', years: ['2019-2024'], type: 'Adventure' },
    { id: 'ktm-duke890', brand: 'KTM', model: '890 Duke R/GP', years: ['2020-2023'], type: 'Naked' },
    { id: 'ktm-adv890', brand: 'KTM', model: '890 Adventure', years: ['2020-2023'], type: 'Adventure' },
    { id: 'ktm-duke990', brand: 'KTM', model: '990 Duke', years: ['2024'], type: 'Naked' },
    { id: 'ktm-sdr1290', brand: 'KTM', model: '1290 Super Duke R', years: ['2014-2023'], type: 'Naked' },
    { id: 'ktm-adv1290', brand: 'KTM', model: '1290 Super Adventure', years: ['2015-2024'], type: 'Adventure' },
    { id: 'ktm-sdr1390', brand: 'KTM', model: '1390 Super Duke R', years: ['2024'], type: 'Naked' },
    { id: 'ktm-smc690', brand: 'KTM', model: '690 SMC R', years: ['2019-2024'], type: 'Offroad' },

    // ==========================================
    //                  SUZUKI
    // ==========================================
    { id: 'suzuki-gsxr125', brand: 'Suzuki', model: 'GSX-R125', years: ['2017-2024'], type: 'Sport' },
    { id: 'suzuki-gsxs125', brand: 'Suzuki', model: 'GSX-S125', years: ['2017-2024'], type: 'Naked' },
    { id: 'suzuki-sv650', brand: 'Suzuki', model: 'SV650', years: ['1999-2024'], type: 'Naked' },
    { id: 'suzuki-vstrom650', brand: 'Suzuki', model: 'V-Strom 650', years: ['2004-2024'], type: 'Adventure' },
    { id: 'suzuki-gsx8s', brand: 'Suzuki', model: 'GSX-8S', years: ['2023-2024'], type: 'Naked' },
    { id: 'suzuki-gsx8r', brand: 'Suzuki', model: 'GSX-8R', years: ['2024'], type: 'Sport' },
    { id: 'suzuki-vstrom800', brand: 'Suzuki', model: 'V-Strom 800', years: ['2023-2024'], type: 'Adventure' },
    { id: 'suzuki-gsxs950', brand: 'Suzuki', model: 'GSX-S950', years: ['2021-2024'], type: 'Naked' },
    { id: 'suzuki-gsxs1000', brand: 'Suzuki', model: 'GSX-S1000/GT', years: ['2015-2024'], type: 'Naked' },
    { id: 'suzuki-vstrom1050', brand: 'Suzuki', model: 'V-Strom 1050', years: ['2020-2024'], type: 'Adventure' },
    { id: 'suzuki-gsxr1000', brand: 'Suzuki', model: 'GSX-R1000', years: ['2001-2024'], type: 'Sport' },
    { id: 'suzuki-hayabusa', brand: 'Suzuki', model: 'Hayabusa', years: ['1999-2024'], type: 'Sport' },
    { id: 'suzuki-gsxr600', brand: 'Suzuki', model: 'GSX-R600', years: ['2001-2019'], type: 'Sport' },
    { id: 'suzuki-gsxr750', brand: 'Suzuki', model: 'GSX-R750', years: ['2000-2019'], type: 'Sport' },

    // ==========================================
    //                 TRIUMPH
    // ==========================================
    { id: 'triumph-trident660', brand: 'Triumph', model: 'Trident 660', years: ['2021-2024'], type: 'Naked' },
    { id: 'triumph-tiger660', brand: 'Triumph', model: 'Tiger Sport 660', years: ['2022-2024'], type: 'Adventure' },
    { id: 'triumph-daytona660', brand: 'Triumph', model: 'Daytona 660', years: ['2024'], type: 'Sport' },
    { id: 'triumph-street765', brand: 'Triumph', model: 'Street Triple 765 R/RS', years: ['2017-2024'], type: 'Naked' },
    { id: 'triumph-tiger900', brand: 'Triumph', model: 'Tiger 900', years: ['2020-2024'], type: 'Adventure' },
    { id: 'triumph-tiger1200', brand: 'Triumph', model: 'Tiger 1200', years: ['2022-2024'], type: 'Adventure' },
    { id: 'triumph-speed1200rs', brand: 'Triumph', model: 'Speed Triple 1200 RS/RR', years: ['2021-2024'], type: 'Naked' },
    { id: 'triumph-bonneville', brand: 'Triumph', model: 'Bonneville T100/T120', years: ['2016-2024'], type: 'Naked' },
    { id: 'triumph-thresxr', brand: 'Triumph', model: 'Thruxton RS', years: ['2016-2024'], type: 'Sport' },
    { id: 'triumph-rocket3', brand: 'Triumph', model: 'Rocket 3', years: ['2020-2024'], type: 'Cruiser' },
    { id: 'triumph-scrambler', brand: 'Triumph', model: 'Scrambler 400 X', years: ['2024'], type: 'Naked' },
    { id: 'triumph-speed400', brand: 'Triumph', model: 'Speed 400', years: ['2024'], type: 'Naked' },

    // ==========================================
    //                  YAMAHA
    // ==========================================
    { id: 'yamaha-mt125', brand: 'Yamaha', model: 'MT-125', years: ['2014-2024'], type: 'Naked' },
    { id: 'yamaha-r125', brand: 'Yamaha', model: 'YZF-R125', years: ['2008-2024'], type: 'Sport' },
    { id: 'yamaha-xsr125', brand: 'Yamaha', model: 'XSR125', years: ['2021-2024'], type: 'Naked' },
    { id: 'yamaha-r3', brand: 'Yamaha', model: 'YZF-R3', years: ['2015-2024'], type: 'Sport' },
    { id: 'yamaha-mt03', brand: 'Yamaha', model: 'MT-03', years: ['2016-2024'], type: 'Naked' },
    { id: 'yamaha-mt07', brand: 'Yamaha', model: 'MT-07', years: ['2014-2024'], type: 'Naked' },
    { id: 'yamaha-r7', brand: 'Yamaha', model: 'YZF-R7', years: ['2021-2024'], type: 'Sport' },
    { id: 'yamaha-tenere700', brand: 'Yamaha', model: 'Tenere 700', years: ['2019-2024'], type: 'Adventure' },
    { id: 'yamaha-xsr700', brand: 'Yamaha', model: 'XSR700', years: ['2016-2024'], type: 'Naked' },
    { id: 'yamaha-mt09', brand: 'Yamaha', model: 'MT-09', years: ['2013-2024'], type: 'Naked' },
    { id: 'yamaha-tracer9', brand: 'Yamaha', model: 'Tracer 9/GT', years: ['2015-2024'], type: 'Touring' },
    { id: 'yamaha-xsr900', brand: 'Yamaha', model: 'XSR900', years: ['2016-2024'], type: 'Naked' },
    { id: 'yamaha-mt10', brand: 'Yamaha', model: 'MT-10', years: ['2016-2024'], type: 'Naked' },
    { id: 'yamaha-r1', brand: 'Yamaha', model: 'YZF-R1', years: ['1998-2024'], type: 'Sport' },
    { id: 'yamaha-r6', brand: 'Yamaha', model: 'YZF-R6', years: ['1999-2020'], type: 'Sport' },
    { id: 'yamaha-tmax', brand: 'Yamaha', model: 'TMAX 560', years: ['2020-2024'], type: 'Scooter' },
    { id: 'yamaha-xmax300', brand: 'Yamaha', model: 'XMAX 300', years: ['2017-2024'], type: 'Scooter' },

    // ==========================================
    //            HUSQVARNA / GASGAS
    // ==========================================
    { id: 'husqvarna-401', brand: 'Husqvarna', model: 'Vitpilen/Svartpilen 401', years: ['2018-2024'], type: 'Naked' },
    { id: 'husqvarna-701', brand: 'Husqvarna', model: '701 Supermoto/Enduro', years: ['2016-2024'], type: 'Offroad' },
    { id: 'husqvarna-901', brand: 'Husqvarna', model: 'Norden 901', years: ['2022-2024'], type: 'Adventure' },
    { id: 'gasgas-sm700', brand: 'GasGas', model: 'SM 700', years: ['2022-2024'], type: 'Offroad' },

    // ==========================================
    //                 MV AGUSTA
    // ==========================================
    { id: 'mv-f3', brand: 'MV Agusta', model: 'F3 800/RR', years: ['2013-2024'], type: 'Sport' },
    { id: 'mv-brutale800', brand: 'MV Agusta', model: 'Brutale 800 RR', years: ['2013-2024'], type: 'Naked' },
    { id: 'mv-dragster800', brand: 'MV Agusta', model: 'Dragster 800 RR', years: ['2014-2024'], type: 'Naked' },
    { id: 'mv-superveloce', brand: 'MV Agusta', model: 'Superveloce 800', years: ['2020-2024'], type: 'Sport' },
    { id: 'mv-brutale1000', brand: 'MV Agusta', model: 'Brutale 1000 RR', years: ['2020-2024'], type: 'Naked' },

    // ==========================================
    //              HARLEY-DAVIDSON
    // ==========================================
    { id: 'hd-sportster-s', brand: 'Harley-Davidson', model: 'Sportster S', years: ['2021-2024'], type: 'Cruiser' },
    { id: 'hd-panamerica', brand: 'Harley-Davidson', model: 'Pan America 1250', years: ['2021-2024'], type: 'Adventure' },
    { id: 'hd-fatboy', brand: 'Harley-Davidson', model: 'Fat Boy 114', years: ['2018-2024'], type: 'Cruiser' },
    { id: 'hd-iron883', brand: 'Harley-Davidson', model: 'Sportster Iron 883', years: ['2009-2022'], type: 'Cruiser' },
    { id: 'hd-breakout', brand: 'Harley-Davidson', model: 'Breakout 117', years: ['2018-2024'], type: 'Cruiser' },

    // ==========================================
    //              ROYAL ENFIELD
    // ==========================================
    { id: 're-himalayan', brand: 'Royal Enfield', model: 'Himalayan 411', years: ['2016-2023'], type: 'Adventure' },
    { id: 're-himalayan450', brand: 'Royal Enfield', model: 'Himalayan 450', years: ['2024'], type: 'Adventure' },
    { id: 're-interceptor', brand: 'Royal Enfield', model: 'Interceptor 650', years: ['2018-2024'], type: 'Naked' },
    { id: 're-continental', brand: 'Royal Enfield', model: 'Continental GT 650', years: ['2018-2024'], type: 'Naked' },
    { id: 're-meteor', brand: 'Royal Enfield', model: 'Meteor 350', years: ['2020-2024'], type: 'Cruiser' },
    { id: 're-supermeteor', brand: 'Royal Enfield', model: 'Super Meteor 650', years: ['2023-2024'], type: 'Cruiser' },

    // ==========================================
    //                 CFMOTO
    // ==========================================
    { id: 'cfmoto-450sr', brand: 'CFMoto', model: '450SR', years: ['2023-2024'], type: 'Sport' },
    { id: 'cfmoto-650nk', brand: 'CFMoto', model: '650NK', years: ['2019-2024'], type: 'Naked' },
    { id: 'cfmoto-800nk', brand: 'CFMoto', model: '800NK', years: ['2023-2024'], type: 'Naked' },
    { id: 'cfmoto-800mt', brand: 'CFMoto', model: '800MT', years: ['2021-2024'], type: 'Adventure' },
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

// Expand years like "2017-2024" into individual years for the UI
// Monkey-patching the database for UI consumption
BIKE_DATABASE.forEach(bike => {
    const expandedYears: string[] = [];
    bike.years.forEach(range => {
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(y => parseInt(y));
            for (let i = end; i >= start; i--) {
                expandedYears.push(i.toString());
            }
        } else {
            expandedYears.push(range);
        }
    });
    // Remove duplicates and sort descending
    bike.years = Array.from(new Set(expandedYears)).sort((a, b) => parseInt(b) - parseInt(a));
});
