import { err, ok } from "neverthrow";
import { NpmReleaseError } from "./NpmReleaseError.js";

export type NpmPackageHistory = {
  name: string;
  versions: Record<string, { gitHead?: string; dist?: { integrity?: string } }>;
  tags: Record<string, string>;
};

export const planNpmRelease = (
  histories: NpmPackageHistory[],
  source: string,
  channel: string,
  runId: string,
  attempt: string,
  sourceVersion: string,
) => {
  if (!/^[a-f0-9]{40}$/.test(source) || !["stable", "canary"].includes(channel))
    return err(
      new NpmReleaseError("Invalid source revision or release channel"),
    );
  if (!/^\d+$/.test(runId) || !/^\d+$/.test(attempt))
    return err(new NpmReleaseError("Release run and attempt must be numeric"));
  if (histories.length !== 1 || histories[0]?.name !== "anatomy-cli")
    return err(new NpmReleaseError("Only anatomy-cli may be published"));
  if (!/^0\.0\.(0|[1-9]\d*)$/.test(sourceVersion))
    return err(new NpmReleaseError("Source version must be a stable 0.0.x version"));
  let highest = 0;
  const sameSource = new Set<string>();
  for (const history of histories) {
    for (const [version, record] of Object.entries(history.versions)) {
      if (!/^\d+\.\d+\.\d+$/.test(version)) continue;
      if (!/^0\.0\.\d+$/.test(version))
        return err(
          new NpmReleaseError(
            `${history.name}: only the 0.0.x release line is enabled`,
          ),
        );
      highest = Math.max(highest, Number(version.split(".")[2]));
      if (record.gitHead === source) sameSource.add(version);
    }
  }
  if (sameSource.size > 1)
    return err(
      new NpmReleaseError("Source revision has conflicting stable versions"),
    );
  const previous = [...sameSource][0];
  if (
    channel === "stable" &&
    Number(sourceVersion.split(".")[2]) < highest
  )
    return err(
      new NpmReleaseError(
        "Refusing to restore latest to an older source release",
      ),
    );
  if (channel === "stable" && previous && previous !== sourceVersion)
    return err(new NpmReleaseError("Source revision was already published with a different version"));
  if (
    channel === "stable" &&
    histories[0]?.versions[sourceVersion] &&
    histories[0].versions[sourceVersion]?.gitHead !== source
  )
    return err(new NpmReleaseError("Source version is already published from another revision; run bun run version:patch"));
  const version =
    channel === "canary" ? `${sourceVersion}-canary.${runId}.${attempt}` : sourceVersion;
  return ok({
    version,
    tag: channel === "canary" ? "canary" : "latest",
    source,
    channel,
  });
};
