import { storage } from "./storage";

const DOMAIN = "https://milltownabc.co.uk";

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
}

const pageMeta: Record<string, PageMeta> = {
  "/": {
    title: "Mill Town ABC - Boxing Club in Glossop | Training for All Levels",
    description: "Mill Town ABC is a boxing club based at Whitfield Community Centre in Glossop. Led by Head Coach Alex Clegg, ABA National Champion. Classes from just £5. All levels welcome.",
    canonical: `${DOMAIN}/`,
  },
  "/about": {
    title: "About Mill Town ABC | Our Story & Head Coach Alex Clegg",
    description: "Learn about Mill Town ABC boxing club in Glossop. Head Coach Alex Clegg brings 70+ amateur bouts, 8x NW Champion titles and ABA National Champion experience to every session.",
    canonical: `${DOMAIN}/about`,
  },
  "/services": {
    title: "Training Programmes | Mill Town ABC Boxing Club Glossop",
    description: "Explore our boxing training programmes: Beginner Boxers, General Training, and Carded Boxers. Professional coaching at Whitfield Community Centre, Glossop. £5 per session.",
    canonical: `${DOMAIN}/services`,
  },
  "/sessions": {
    title: "Class Schedule & Booking | Mill Town ABC Boxing Club",
    description: "View our class schedule and book your boxing sessions. Monday, Wednesday & Saturday classes available. £5 per session, first session FREE. Book online instantly.",
    canonical: `${DOMAIN}/sessions`,
  },
  "/safety": {
    title: "Safety Policy | Mill Town ABC Boxing Club Glossop",
    description: "Our commitment to safety at Mill Town ABC. Read our safety policies, guidelines and procedures for all members and visitors at Whitfield Community Centre.",
    canonical: `${DOMAIN}/safety`,
  },
  "/blog": {
    title: "News & Updates | Mill Town ABC Boxing Club",
    description: "Latest news, updates, and articles from Mill Town ABC boxing club in Glossop. Stay informed about events, results, and club announcements.",
    canonical: `${DOMAIN}/blog`,
  },
  "/contact": {
    title: "Contact Mill Town ABC | Boxing Club in Glossop",
    description: "Get in touch with Mill Town ABC. Call Alex on 07565 208193 or Mark on 07713 659360. Visit us at Whitfield Community Centre, Ebenezer Street, Glossop, SK13 8JY.",
    canonical: `${DOMAIN}/contact`,
  },
  "/privacy": {
    title: "Privacy Policy | Mill Town ABC Boxing Club",
    description: "Mill Town ABC privacy policy. Learn how we collect, use and protect your personal data in compliance with UK GDPR and the Data Protection Act 2018.",
    canonical: `${DOMAIN}/privacy`,
  },
  "/terms": {
    title: "Terms & Conditions | Mill Town ABC Boxing Club",
    description: "Terms and conditions for using the Mill Town ABC website and booking boxing sessions. Read before registering or booking classes.",
    canonical: `${DOMAIN}/terms`,
  },
  "/register": {
    title: "Join Mill Town ABC | Register for Boxing Classes in Glossop",
    description: "Register for Mill Town ABC boxing club. Create your account to book classes, track your training and join our community. First session FREE!",
    canonical: `${DOMAIN}/register`,
  },
  "/login": {
    title: "Member Login | Mill Town ABC Boxing Club",
    description: "Log in to your Mill Town ABC member account to view bookings, book classes and manage your membership.",
    canonical: `${DOMAIN}/login`,
  },
};

const defaultMeta: PageMeta = {
  title: "Mill Town ABC - Boxing Club in Glossop | Training for All Levels",
  description: "Mill Town ABC is a boxing club based at Whitfield Community Centre in Glossop. Led by Head Coach Alex Clegg, ABA National Champion. Classes from just £5. All levels welcome.",
  canonical: `${DOMAIN}/`,
};

export async function getPageMeta(url: string): Promise<PageMeta> {
  const cleanUrl = url.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";

  if (pageMeta[cleanUrl]) {
    return pageMeta[cleanUrl];
  }

  if (cleanUrl.startsWith("/blog/")) {
    const slug = cleanUrl.replace("/blog/", "");
    try {
      const post = await storage.getBlogPostBySlug(slug);
      if (post) {
        const title = post.metaTitle || `${post.title} | Mill Town ABC`;
        const description = post.metaDescription ||
          (post.excerpt ? post.excerpt.slice(0, 160) : `Read ${post.title} from Mill Town ABC boxing club in Glossop.`);
        return { title, description, canonical: `${DOMAIN}${cleanUrl}` };
      }
    } catch (e) {}
    const fallbackTitle = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
      title: `${fallbackTitle} | Mill Town ABC`,
      description: `Read this article from Mill Town ABC boxing club in Glossop.`,
      canonical: `${DOMAIN}${cleanUrl}`,
    };
  }

  return { ...defaultMeta, canonical: `${DOMAIN}${cleanUrl}` };
}

export async function injectMetaTags(html: string, url: string): Promise<string> {
  const meta = await getPageMeta(url);

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`
  );

  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`
  );

  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeAttr(meta.canonical)}" />`
  );

  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeAttr(meta.canonical)}" />`
  );

  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`
  );

  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`
  );

  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`
  );

  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`
  );

  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
