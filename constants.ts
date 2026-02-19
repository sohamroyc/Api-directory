
import { ApiCategory } from './types';

export const CATEGORIES = Object.values(ApiCategory);

export const INITIAL_MOCK_APIS = [
  {
    id: '1',
    name: 'PokeAPI',
    website: 'https://pokeapi.co/',
    description: 'A complete RESTful API for Pokémon data.',
    category: ApiCategory.ENTERTAINMENT,
    auth_required: false,
    source: 'Curated List',
    created_at: new Date().toISOString(),
    ai_summary: 'An extensive database providing details on every aspect of the Pokémon franchise, from stats to abilities.'
  },
  {
    id: '2',
    name: 'OpenWeatherMap',
    website: 'https://openweathermap.org/api',
    description: 'Access current weather data for any location on Earth.',
    category: ApiCategory.DATA,
    auth_required: true,
    source: 'Curated List',
    created_at: new Date().toISOString(),
    ai_summary: 'Reliable weather forecasting and historical data available through simple HTTP requests with API key authentication.'
  },
  {
    id: '3',
    name: 'JSONPlaceholder',
    website: 'https://jsonplaceholder.typicode.com/',
    description: 'Free to use fake online REST API for testing and prototyping.',
    category: ApiCategory.DEVELOPER,
    auth_required: false,
    source: 'Curated List',
    created_at: new Date().toISOString(),
    ai_summary: 'A developer essential for mock data testing without the need for setting up a custom backend environment.'
  }
];
