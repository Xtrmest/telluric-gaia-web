import { Thermometer } from "lucide-react";
import { Slider } from "../components/ui/slider";
import { useTemp } from "../context/TempContext";

export const TempController = ({ compact = false }) => {
  const { temp, setTemp, accent, activated } = useTemp();

  return (
    <div
      className={`flex items-center gap-3 ${compact ? "" : "rounded-md border border-[#1E2330] bg-[#0F1117]/60 px-4 py-2.5"}`}
      data-testid="temp-controller"
    >
      <Thermometer className="h-4 w-4 shrink-0" style={{ color: accent }} />
      <div className="flex flex-col gap-1 min-w-[120px] flex-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-mono text-slate-500">
            Thermal Trigger
          </span>
          <span
            className="font-mono text-[10px] font-bold tabular-nums"
            style={{ color: accent }}
            data-testid="temp-value"
          >
            {temp}&deg;C {activated ? "· ACTIVE" : ""}
          </span>
        </div>
        <Slider
          value={[temp]}
          min={20}
          max={40}
          step={1}
          onValueChange={(v) => setTemp(v[0])}
          data-testid="temp-slider"
          aria-label="Thermal activation temperature"
        />
      </div>
    </div>
  );
};
