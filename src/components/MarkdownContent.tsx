import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { slugifyHeading } from '@/lib/toc';

function resolveAssetSrc(src?: string): string | undefined {
  if (!src) return src;
  if (src.startsWith('/assets/')) {
    return `${import.meta.env.BASE_URL}${src.slice(1)}`;
  }
  return src;
}

function MarkdownLink({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  if (
    href &&
    href.startsWith('/') &&
    !href.startsWith('//') &&
    !href.startsWith('/assets/')
  ) {
    return (
      <Link to={href} className="text-splendor-accent hover:underline">
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className="text-splendor-accent hover:underline"
      {...(href?.startsWith('http')
        ? { target: '_blank', rel: 'noreferrer' }
        : {})}
    >
      {children}
    </a>
  );
}

function Heading({
  level,
  children,
}: {
  level: 1 | 2 | 3 | 4;
  children: ReactNode;
}) {
  const text = flattenText(children);
  const id = slugifyHeading(text);
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';

  if (level === 1) {
    return <Tag>{children}</Tag>;
  }

  return (
    <Tag id={id} className="scroll-mt-24">
      <a href={`#${id}`} className="no-underline text-inherit hover:opacity-80">
        {children}
      </a>
    </Tag>
  );
}

function flattenText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (typeof node === 'object' && 'props' in node) {
    return flattenText((node as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-splendor prose-splendor--dropcap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <Heading level={1}>{children}</Heading>,
          h2: ({ children }) => <Heading level={2}>{children}</Heading>,
          h3: ({ children }) => <Heading level={3}>{children}</Heading>,
          h4: ({ children }) => <Heading level={4}>{children}</Heading>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table>{children}</table>
            </div>
          ),
          img: ({ src, alt }) => (
            <img
              src={resolveAssetSrc(src)}
              alt={alt ?? ''}
              className="my-4 w-full h-auto border border-splendor-line shadow-soft bg-[#1a120e]"
            />
          ),
          a: ({ href, children }) => (
            <MarkdownLink href={href}>{children}</MarkdownLink>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
