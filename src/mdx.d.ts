declare module '*.mdx' {
  export const frontmatter: {
    title: string;
    date: string;
    category: string;
    description: string;
    coverImage?: string;
    featured?: boolean;
  };

  export default function MDXContent(props: Record<string, unknown>): JSX.Element;
}
