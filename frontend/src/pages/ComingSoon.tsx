import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { PencilIcon } from "@/components/icons/StationeryIcons";

const ComingSoon = () => {
  const location = useLocation();
  const pageName = location.pathname.split("/").pop() || "page";
  const displayName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="max-w-md w-full border-2 animate-fade-slide">
        <CardContent className="p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-6 rounded-2xl bg-primary/10">
              <PencilIcon className="w-16 h-16 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">{displayName}</h2>
            <p className="text-lg text-muted-foreground">
              We're working hard to bring you this feature. Check back soon!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
