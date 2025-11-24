declare module 'chroma-js' {
  export interface ChromaStatic {
    (color: string | number | [number, number, number]): ChromaInstance
    rgb(r: number, g: number, b: number): ChromaInstance
  }

  export interface ChromaInstance {
    rgb(): [number, number, number]
    hsl(): [number, number, number] | number[]
    darken(amount?: number): ChromaInstance
    brighten(amount?: number): ChromaInstance
    desaturate(amount?: number): ChromaInstance
  }

  const chroma: ChromaStatic
  export default chroma
}

