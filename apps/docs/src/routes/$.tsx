import { createFileRoute } from "@tanstack/react-router";
import { DocsPage } from "@/pages/DocsPage";

export const Route = createFileRoute("/$")({ component: DocsPage });
