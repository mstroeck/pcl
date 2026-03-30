/**
 * Tracks the plugin type for each plugin instance.
 *
 * Uses a WeakMap so entries are automatically garbage-collected when a plugin
 * object is no longer referenced elsewhere — no manual cleanup needed.
 *
 * Set exclusively by loadPlugin(); read by the registry.  Plugins registered
 * directly (e.g. in tests) must call setPluginType() before registering.
 */
const pluginTypeMap = new WeakMap<object, string>();

export function setPluginType(plugin: object, type: string): void {
  pluginTypeMap.set(plugin, type);
}

export function getPluginType(plugin: object): string | undefined {
  return pluginTypeMap.get(plugin);
}
