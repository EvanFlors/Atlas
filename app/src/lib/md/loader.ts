const RAW_LAZY = import.meta.glob('../../../contenidos/**/*.md', {
    query: "?raw",
    import: "default",
}) as Record<string, () => Promise<string>>;

export class ModuleNotFound extends Error {
  readonly path: string
  constructor(path: string) {
    super(`ModuleNotFound: contenidos/${path}`)
    this.name = 'ModuleNotFound'
    this.path = path
  }
}

export async function loadModule(path: string): Promise<string> {
  const key = Object.keys(RAW_LAZY).find((k) => k.endsWith(`/contenidos/${path}`))
  if (!key) throw new ModuleNotFound(path)
  return await RAW_LAZY[key]()
}