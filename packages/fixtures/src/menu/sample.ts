export interface MenuItem {
  name: string;
  price: number;
  description: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface MenuData {
  name: string;
  tagline: string;
  location: string;
  sections: MenuSection[];
  footer: string;
}

export const menuSample: MenuData = {
  name: 'Maison Laurent',
  tagline: 'Seasonal Provençal cooking, wood fire, and natural wine',
  location: '42 Rue des Oliviers · Dinner Tuesday-Sunday',
  sections: [
    {
      title: 'Starters',
      items: [
        {
          name: 'Heirloom Tomato & Burrata',
          price: 16,
          description: 'Late-summer tomatoes, creamy burrata, basil oil, aged balsamic.',
        },
        {
          name: 'Chilled Pea Velouté',
          price: 14,
          description: 'Garden peas, crème fraîche, mint, toasted hazelnut.',
        },
        {
          name: 'Grilled Octopus',
          price: 19,
          description: 'Charred octopus, white bean purée, smoked paprika, lemon.',
        },
        {
          name: 'Steak Tartare',
          price: 18,
          description: 'Hand-cut beef, capers, shallot, cured egg yolk, sourdough.',
        },
      ],
    },
    {
      title: 'Mains',
      items: [
        {
          name: 'Roasted Branzino',
          price: 34,
          description: 'Whole sea bass, fennel, salsa verde, charred lemon.',
        },
        {
          name: 'Duck Breast à l’Orange',
          price: 38,
          description: 'Five-spice duck, blood orange, parsnip, watercress.',
        },
        {
          name: 'Wild Mushroom Risotto',
          price: 26,
          description: 'Carnaroli rice, porcini, Parmesan, truffle, chive.',
        },
        {
          name: 'Dry-Aged Ribeye',
          price: 46,
          description: '45-day ribeye, bone marrow butter, frites, béarnaise.',
        },
      ],
    },
    {
      title: 'Desserts',
      items: [
        {
          name: 'Crème Brûlée',
          price: 12,
          description: 'Tahitian vanilla custard, caramelized sugar crust.',
        },
        {
          name: 'Dark Chocolate Tart',
          price: 13,
          description: '70% Valrhona ganache, sea salt, olive oil, crème.',
        },
        {
          name: 'Lavender Panna Cotta',
          price: 11,
          description: 'Provençal lavender, honey, macerated berries.',
        },
        {
          name: 'Selection of Cheeses',
          price: 17,
          description: 'Three regional cheeses, quince, walnut, honeycomb.',
        },
      ],
    },
    {
      title: 'Drinks',
      items: [
        {
          name: 'Côtes du Rhône, Glass',
          price: 14,
          description: 'Grenache-Syrah, dark fruit, garrigue, soft tannin.',
        },
        {
          name: 'Provence Rosé, Glass',
          price: 13,
          description: 'Crisp, dry, notes of peach and white flower.',
        },
        {
          name: 'House Negroni',
          price: 15,
          description: 'Gin, Campari, sweet vermouth, flamed orange.',
        },
        {
          name: 'Espresso & Digestif',
          price: 10,
          description: 'Double espresso paired with house Armagnac.',
        },
      ],
    },
  ],
  footer:
    'A discretionary 18% service charge is added for parties of six or more. Menu changes daily with the market.',
};
