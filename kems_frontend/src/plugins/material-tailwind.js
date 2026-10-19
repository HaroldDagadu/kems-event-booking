import { ThemeProvider } from "@material-tailwind/react";

export function withMaterialTailwind(Component) {
  return function WrappedComponent(props) {
    return (
      <ThemeProvider>
        <Component {...props} />
      </ThemeProvider>
    );
  };
} 