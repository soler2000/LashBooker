type VersionBadgeProps = {
  className?: string;
};

const displayVersion =
  process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local-dev";

export default function VersionBadge({ className = "" }: VersionBadgeProps) {
  const normalizedVersion = displayVersion.length > 12 ? displayVersion.slice(0, 12) : displayVersion;

  return (
    <span
      className={`inline-flex items-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-xs font-medium uppercase tracking-wide text-cyan-200 ${className}`.trim()}
      title={`Build version: ${displayVersion}`}
    >
      Version {normalizedVersion}
    </span>
  );
}
