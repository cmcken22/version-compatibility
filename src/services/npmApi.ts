// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import semver from "semver";
// import type { Pokemon } from "./types";

const TAG = "NPM";

// Define a service using a base URL and expected endpoints
export const npmApiSlice = createApi({
  reducerPath: "npmApiSlice",
  baseQuery: fetchBaseQuery({ baseUrl: "https://registry.npmjs.org/" }),
  tagTypes: [TAG],
  endpoints: builder => ({
    getReposByName: builder.query<any, string>({
      query: name => `-/v1/search?text=${name}&size=5`,
      providesTags: (result, error, id) => {
        return [{ type: TAG, id: `${id}--search` }];
      },
      transformResponse: (response: any) => {
        const res: any = [];
        if (response?.objects) {
          const { objects } = response;
          for (const object of objects) {
            res.push({
              label: object.package.name,
              value: object.package.name,
            });
          }
        }
        return res;
      },
    }),
    getVersions: builder.query<any, string>({
      query: name => name,
      providesTags: (result, error, id) => {
        return [{ type: TAG, id: `${id}--versions` }];
      },
      transformResponse: (response: any) => {
        const res: any = [];
        if (response?.versions) {
          const { versions } = response;
          for (const version in versions) {
            const preRelease = semver.prerelease(version);
            if (preRelease) continue;
            res.push({
              label: version,
              value: version,
            });
          }
        }
        return res;
      },
    }),
    getPackageInfo: builder.query<any, string>({
      query: name => name,
      providesTags: (result, error, id) => {
        return [{ type: TAG, id: `${id}--info` }];
      },
    }),
    getPackageVersionInfo: builder.query<
      any,
      { name: string; version: string }
    >({
      query: ({ name, version }) => name,
      transformResponse: (response: any, _, params: any) => {
        if (response?.versions && response?.versions?.[params?.version]) {
          return response?.versions?.[params?.version];
        }
        return null;
      },
      providesTags: (result, error, params) => {
        return [{ type: TAG, id: `${params.name}--${params.version}` }];
      },
    }),
    getCompatibleVersionsByCondition: builder.query<
      any,
      { name: string; condition: string }
    >({
      query: ({ name, condition }) => name,
      transformResponse: (response: any, _, params: any) => {
        const { condition } = params;

        const res: string[] = [];
        if (response?.versions) {
          const { versions } = response;
          for (const version in versions) {
            const preRelease = semver.prerelease(version);
            if (preRelease) continue;
            const satisfied = semver.satisfies(version, condition);
            if (satisfied) res.push(version);
          }
        }
        return res;
      },
      providesTags: (result, error, params) => {
        return [{ type: TAG, id: `${params.name}--${params.condition}` }];
      },
    }),
    getCompatibleVersionsByComparison: builder.query<
      any,
      { name: string; basePackage: string; baseVersion: string }
    >({
      query: ({ name }) => name,
      transformResponse: (response: any, _, params: any) => {
        const { name, basePackage, baseVersion } = params;
        console.log("\n\n------------");
        console.log("response:", response);
        console.log("------------\n\n");
        // const res: string[] = [];
        // if (response?.versions) {
        //   const { versions } = response;
        //   for (const version in versions) {
        //     const preRelease = semver.prerelease(version);
        //     if (preRelease) continue;
        //     const satisfied = semver.satisfies(version, condition);
        //     if (satisfied) res.push(version);
        //   }
        // }
        return {};
      },
      providesTags: (result, error, params) => {
        const { name, basePackage, baseVersion } = params;
        return [{ type: TAG, id: `${name}--${basePackage}--${baseVersion}` }];
      },
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetReposByNameQuery,
  useGetVersionsQuery,
  useGetPackageInfoQuery,
} = npmApiSlice;
