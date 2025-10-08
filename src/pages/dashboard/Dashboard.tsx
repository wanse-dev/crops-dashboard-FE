import "./Dashboard.css";
import { CountryCropsSection } from "./components/countryCropsSection/CountryCropsSection";
import { CountryChartsSection } from "./components/countryChartsSection/CountryChartsSection";
import { RegionChartsSection } from "./components/regionChartsSection/RegionChartsSection";
import { ComparativeCropsSection } from "./components/comparativeCropsSection/comparativeCropsSection";

export const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="top-section">
        <CountryCropsSection />
        <CountryChartsSection />
      </div>
      <div className="bottom-section">
        <RegionChartsSection />
        <ComparativeCropsSection />
      </div>
    </div>
  );
};
