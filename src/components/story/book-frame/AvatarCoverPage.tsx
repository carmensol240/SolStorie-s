import { cn } from "@/lib/utils";

interface AvatarCoverPageProps {
  src: string;
  title: string;
  childName: string;
  wide: boolean;
  className?: string;
}

/**
 * Cover of a new story: the child's avatar exactly as it is — whole (object-contain), nothing on it.
 * Wide screens: open book, avatar on the left page, title on the right paper page.
 * Phones: avatar on top, title and the child's name below it (never over the picture).
 */
export function AvatarCoverPage({ src, title, childName, wide, className }: AvatarCoverPageProps) {
  const text = (
    <div className="flex flex-col items-center text-center gap-3 px-6" dir="rtl">
      <span className="text-paper-gold text-lg leading-none" aria-hidden="true">✦</span>
      <h1 className="text-2xl md:text-4xl font-black leading-tight">{title}</h1>
      <p className="text-base md:text-lg font-semibold text-paper-foreground/80" data-testid="cover-dedication">
        הספר הזה נוצר במיוחד עבור {childName}
      </p>
    </div>
  );
  const picture = (
    <img
      src={src}
      alt={`כריכת הספר: ${title}`}
      className="w-full h-full object-contain"
      draggable={false}
      data-testid="avatar-cover"
    />
  );
  if (wide) {
    return (
      <div className={cn("w-full h-full grid grid-cols-2 bg-paper text-paper-foreground", className)} dir="ltr">
        <div className="relative h-full min-h-0 p-4 flex items-center justify-center">{picture}</div>
        <div className="h-full flex items-center justify-center border-l border-paper-gold/30">{text}</div>
      </div>
    );
  }
  return (
    <div className={cn("w-full h-full flex flex-col bg-paper text-paper-foreground", className)}>
      <div className="flex-1 min-h-0 p-3 flex items-center justify-center">{picture}</div>
      <div className="shrink-0 py-4">{text}</div>
    </div>
  );
}
