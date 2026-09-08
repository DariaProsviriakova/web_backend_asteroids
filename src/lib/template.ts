import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { escapeHtml } from "./format.js";

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const templatesDir = join(rootDir, "templates");

export type PageName = "feed" | "add" | "cards";

type RenderPageOptions = {
  title: string;
  active: PageName;
  body: string;
};

const readTemplate = (name: string) =>
  readFileSync(join(templatesDir, name), "utf8");

export const fillTemplate = (
  templateName: string,
  values: Record<string, unknown>
) => {
  const template = readTemplate(templateName);

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    values[key] === undefined ? `{{${key}}}` : escapeHtml(values[key])
  );
};

export const renderPage = ({ title, active, body }: RenderPageOptions) => {
  const nav = fillTemplate("partials/tabs.html", {
    feedActive: active === "feed" ? "active" : "",
    addActive: active === "add" ? "active" : "",
    cardsActive: active === "cards" ? "active" : ""
  });

  return readTemplate("layout.html")
    .replaceAll("{{title}}", escapeHtml(title))
    .replaceAll("{{body}}", body)
    .replaceAll("{{tabs}}", nav);
};
