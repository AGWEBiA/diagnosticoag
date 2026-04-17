import { useState } from 'react';
import { Play } from 'lucide-react';

interface YouTubeLiteProps {
  videoId: string;
  title: string;
}

/**
 * Lazy YouTube embed: shows the thumbnail + play button.
 * Only mounts the iframe after the user clicks (saves bandwidth and CLS).
 */
export const YouTubeLite = ({ videoId, title }: YouTubeLiteProps) => {
  const [active, setActive] = useState(false);

  // Prefer hqdefault (always available); maxresdefault may 404 on some videos.
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (active) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Reproduzir vídeo: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-md bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <img
        src={thumb}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/95 shadow-lg transition-transform duration-200 group-hover:scale-110">
          <Play className="ml-1 h-7 w-7 fill-primary-foreground text-primary-foreground" />
        </span>
      </div>
    </button>
  );
};
