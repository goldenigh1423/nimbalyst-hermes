/**
 * Hermes Agent Extension - Frontend Entry Point
 *
 * Registers the Hermes Agent as a coding agent provider in Nimbalyst.
 */

import type { ExtensionContext } from '@nimbalyst/extension-sdk';
import { HermesAgentSettings } from './components/HermesAgentSettings';

export { HermesAgentSettings };

/**
 * Extension activation
 */
export async function activate(context: ExtensionContext) {
  console.log('[Hermes Agent] Extension activated');
}

/**
 * Extension deactivation
 */
export async function deactivate() {
  console.log('[Hermes Agent] Extension deactivated');
}

/**
 * Components exported by this extension
 */
export const components = {
  HermesAgentSettings,
};
