import { payloadAdminIndexRoute } from "@payloadcms/tanstack-start/client";
import { createFileRoute } from "@tanstack/react-router";

import { loadAdminPageRSC } from "./_payload/server.functions";

export const Route = createFileRoute("/_payload/admin/")(
  payloadAdminIndexRoute({ load: loadAdminPageRSC }),
);
