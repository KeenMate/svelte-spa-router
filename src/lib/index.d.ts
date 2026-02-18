/**
 * Main entry point for @keenmate/svelte-spa-router
 */

// Main router component
export { default as Router } from './Router.svelte';

// Core utilities
export * from './utils';
export * from './constants';
export { default as wrap } from './wrap';

// Named routes system
export * from './routes';

// Helpers
export * from './helpers/permissions';
export * from './helpers/url-helpers';
