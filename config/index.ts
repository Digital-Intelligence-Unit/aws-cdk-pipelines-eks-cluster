
import { iSettings } from "../lib/types/interfaces";
import { environment } from "./environment";

// Export local config for environment
const localSettings = require("./" + environment.name + ".config.json") as iSettings;
export const _SETTINGS: iSettings = localSettings || {
  manageDNS: false, // Change to true if you want AWS to handle Global DNS records, set to false if handled by a third party (e.g. nhs.uk domains = NHS Digital)
  containerIPs: ["10.1.0.0/19"], // Replace if you have a unique IP range, for example from HSCN to ensure it's unique across the network
  existingVPC: false, // Set to true if you have an existing VPC, set to false if you want to create a new VPC
  // existingVPCID: "vpc-0c9f9f9f9f9f9f9f9", // Set to the VPC ID if you have an existing VPC
  // existingSubnetIDs: [
  //   { ID: "subnet-0a9f9f9f9f9f9f9f9", AZ: "eu-west-2a" },
  //   { ID: "subnet-0b9f9f9f9f9f9f9f9", AZ: "eu-west-2b" },
  // ], // Set to the subnet IDs if you have an existing VPC and subnets to deploy into
  // ADD IF YOU WISH TO USE A DOCKERHUB ACCOUNT FOR IMPROVED IMAGE PULLS (See authentication/README.md)
  //   dockerhub: {
  //     username: "USERNAME",
  //     password: "PASSWORD",
  //   },
  existingRDS: false, // Set to true if you have an existing RDS, set to false if you want to create a new RDS
  newRDSConfig: {
    username: "Admin",
    instanceType: "t3.small",
    deletionProtection: false,
  },
  github: {
    oauthToken: "TOKENHERE",
    connectionID: "",
  },
  serversAlwaysOn: false, // Set to true if you want to keep the servers always on, set to false if you want to turn them off outside of working hours
  ECSConfig: {
    minCapacity: 1,
    maxCapacity: 6,
    desiredCapacity: 3,
  },
  Route53ResolverConfig: {
    ips: []
  },
  domainName: "example.com",
};

// Set variables
export const _AWSREGION = environment.region;
export const _ACCOUNT = environment.account;
export const _MYDOMAIN = _SETTINGS.domainName || "example.com";

// ACCESS LIST (ISO 3166)
// This list will filter the access to the platform and external facing resources to IP addresses originating in specific countries.
// Additional country codes can be found here: https://www.iso.org/obp/ui/#search and are added as comma-separated list, i.e. [ "GB", "CA" ]
export const _AccessListCountries = ["GB"];

// Default application
export const _PLATFORMAPP = {
  repo: "NHS_Business_Intelligence_Platform_App",
  name: "BI_Platform",
  owner: "Digital-Intelligence-Unit",
  branch: environment.github.working_branch
};

