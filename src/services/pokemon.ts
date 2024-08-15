// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import type { Pokemon } from "./types";

const TAG = "Pokemon";

// Define a service using a base URL and expected endpoints
export const pokemonApiSlice = createApi({
  reducerPath: "pokemonApiSlice",
  baseQuery: fetchBaseQuery({ baseUrl: "https://pokeapi.co/api/v2/" }),
  tagTypes: [TAG],
  endpoints: builder => ({
    getPokemonByName: builder.query<any, string>({
      query: name => `pokemon/${name}`,
      providesTags: (result, error, id) => {
        return [{ type: TAG, id }];
      },
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetPokemonByNameQuery } = pokemonApiSlice;
