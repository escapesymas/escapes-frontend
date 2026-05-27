export const MARKETING_TIERS = {
  BRONCE: {
    min: 0,
    max: 149,
    discount: 0,
    shipping: 15,
    label: "Bronce"
  },
  PLATA: {
    min: 150,
    max: 299,
    discount: 5,
    shipping: 0,
    label: "Plata"
  },
  ORO: {
    min: 300,
    max: 499,
    discount: 10,
    shipping: 0,
    label: "Oro"
  },
  PLATINO: {
    min: 500,
    max: Infinity,
    discount: 15,
    shipping: 0,
    label: "Platino"
  }
};
