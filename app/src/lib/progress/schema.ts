export const STORAGE_KEY = 'atlas-academia-v1'

export type ProgressState = {
  done: Record<string, boolean>
  sections: Record<string, boolean>
  bookmarks: Record<string, boolean>
  last: string
}

export const EMPTY: ProgressState = { done: {}, sections: {}, bookmarks: {}, last: '' }
