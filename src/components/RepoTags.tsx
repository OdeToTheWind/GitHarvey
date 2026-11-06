import { abandonedNote, sizeTag } from "@/lib/insights";
import { LICENSE_LABELS, licenseKind } from "@/lib/licenses";
import type { RepoSummary } from "@/types";

const chip = "rounded-full border border-line px-2 py-0.5 text-xs text-muted";

/** Small labels under the repo name: license type, size hint, and a plain warning when it looks abandoned. */
export function RepoTags({ repo }: { repo: RepoSummary }) {
  const warning = abandonedNote(repo);
  const size = sizeTag(repo);
  return (
    <>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Labels">
        <li className={chip}>{LICENSE_LABELS[licenseKind(repo.license)]}</li>
        {size && <li className={chip}>{size}</li>}
      </ul>
      {warning && <p className="mt-2 text-sm text-clay">{warning}</p>}
    </>
  );
}
