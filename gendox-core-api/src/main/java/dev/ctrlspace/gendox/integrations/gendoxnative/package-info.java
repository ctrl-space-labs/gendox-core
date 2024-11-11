package dev.ctrlspace.gendox.integrations.gendoxnative;

/**
 * This is an experimental Gendox Native integration.
 * When setup, the Gendox Platform will be able to pull data from any application implementing it.
 *
 * The other application need to expose 2 APIs:
 * - List contents per Project
 *   - Returns all the different pages need to be indexed by Gendox
 * - Get content By ID
 *   - Gets the content to be indexed
 *
 */