// CSS module declarations for TypeScript
declare module '*.css' {
  const styles: { readonly [className: string]: string }
  export default styles
}

// Also allow side-effect CSS imports
declare module '*.css' {}
