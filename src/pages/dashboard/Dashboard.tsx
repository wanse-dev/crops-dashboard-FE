import "./Dashboard.css";
import { CountryCropsSection } from "./components/countryCropsSection/CountryCropsSection";
import { CountryChartsSection } from "./components/countryChartsSection/CountryChartsSection";
import { RegionChartsSection } from "./components/regionChartsSection/RegionChartsSection";
import { ComparativeCropsSection } from "./components/comparativeCropsSection/ComparativeCropsSection";
import { useAuth } from "../../contexts/authContext";
import axiosInstance from "../../config/axios";
import { useState, useEffect } from "react";
import type { CultivoData } from "../../types/CultivoData";
import type { PaisData } from "../../types/PaisData";
import type { RegionData } from "../../types/RegionData";
import type { ProvinciaData } from "../../types/ProvinciaData";
import type { RegionChartsSectionProps } from "../../types/RegionChartsSectionProps";

export const Dashboard = () => {
  const [cultivos, setCultivos] = useState<CultivoData[]>([]);
  const [paises, setPaises] = useState<PaisData[]>([]);
  const [regiones, setRegiones] = useState<RegionData[]>([]);
  const [provincias, setProvincias] = useState<ProvinciaData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [selectedAñoDesde, setSelectedAñoDesde] = useState("");
  const [selectedAñoHasta, setSelectedAñoHasta] = useState("");
  const [selectedCultivo, setSelectedCultivo] = useState("");
  const [selectedNivel, setSelectedNivel] = useState("");
  const [selectedUbicacion1, setSelectedUbicacion1] = useState("");
  const [selectedUbicacion2, setSelectedUbicacion2] = useState("");

  const [appliedFilters, setAppliedFilters] =
    useState<RegionChartsSectionProps>({
      añoDesde: "",
      añoHasta: "",
      cultivo: "",
      nivel: "",
      ubicacion1: "",
      ubicacion2: "",
    });

  const auth = useAuth();

  const fetchData = async () => {
    try {
      const firebaseUID = auth?.currentUser?.uid;
      if (!firebaseUID) {
        throw new Error("El usuario no está autenticado");
      }

      const cultivos = await axiosInstance.get("/cultivo");
      setCultivos(cultivos.data.data || []);
      console.debug("API response for cultivos:", cultivos.data);

      const paises = await axiosInstance.get("/pais");
      setPaises(paises.data.data || []);
      console.debug("API response for paises:", paises.data);

      const regiones = await axiosInstance.get("/region");
      setRegiones(regiones.data.data || []);
      console.debug("API response for regiones:", regiones.data);

      const provincias = await axiosInstance.get("/provincia");
      setProvincias(provincias.data.data || []);
      console.debug("API response for provincias:", provincias.data);
    } catch (error: any) {
      setError(error.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setAppliedFilters({
      añoDesde: selectedAñoDesde,
      añoHasta: selectedAñoHasta,
      cultivo: selectedCultivo,
      nivel: selectedNivel,
      ubicacion1: selectedUbicacion1,
      ubicacion2: selectedUbicacion2,
    });
  };

  return (
    <div className="dashboard-container">
      <nav className="control-panel">
        <form action="" onSubmit={handleSubmit}>
          <input
            type="number"
            placeholder="Desde año"
            name="year-desde"
            id="input-year-desde"
            min="1970"
            max="2023"
            step="1"
            value={selectedAñoDesde}
            onChange={(e) => {
              const nuevoAño = e.target.value;
              setSelectedAñoDesde(nuevoAño);

              if (
                selectedAñoHasta &&
                Number(nuevoAño) >= Number(selectedAñoHasta)
              ) {
                setSelectedAñoHasta("");
              }
            }}
          />

          <input
            type="number"
            placeholder="Hasta año"
            name="year-hasta"
            id="input-year-hasta"
            min={selectedAñoDesde ? Number(selectedAñoDesde) + 1 : 1970}
            max="2023"
            step="1"
            value={selectedAñoHasta}
            onChange={(e) => setSelectedAñoHasta(e.target.value)}
            disabled={!selectedAñoDesde}
          />

          <select
            name="crop"
            id="input-crop"
            disabled={loading}
            value={selectedCultivo}
            onChange={(e) => setSelectedCultivo(e.target.value)}
          >
            <option key="default-option" value="" disabled>
              {loading ? "Cargando..." : error ? "Error al cargar" : "Cultivo"}
            </option>
            {!loading &&
              !error &&
              cultivos.map((cultivo: CultivoData) => (
                <option key={cultivo.id_cultivo} value={cultivo.id_cultivo}>
                  {cultivo.nombre}
                </option>
              ))}
          </select>

          <select
            name="level"
            id="input-level"
            disabled={loading}
            value={selectedNivel}
            onChange={(e) => {
              setSelectedNivel(e.target.value);
              setSelectedUbicacion1("");
              setSelectedUbicacion2("");
            }}
          >
            <option key="default-level-option" value="" disabled>
              Nivel
            </option>
            <option value="pais">País</option>
            <option value="region">Región</option>
            <option value="provincia">Provincia</option>
          </select>

          <select
            name="place-1"
            id="place-1"
            disabled={!selectedNivel}
            value={selectedUbicacion1}
            onChange={(e) => setSelectedUbicacion1(e.target.value)}
          >
            <option key="default-option" value="" disabled>
              {loading
                ? "Cargando..."
                : error
                ? "Error al cargar"
                : "Ubicación 1"}
            </option>

            {!loading &&
              !error &&
              selectedNivel === "pais" &&
              paises.map((pais: PaisData) => (
                <option key={pais.id_pais} value={pais.id_pais}>
                  {pais.nombre}
                </option>
              ))}

            {!loading &&
              !error &&
              selectedNivel === "region" &&
              regiones.map((region: RegionData) => (
                <option key={region.id_region} value={region.id_region}>
                  {region.nombre}
                </option>
              ))}

            {!loading &&
              !error &&
              selectedNivel === "provincia" &&
              provincias.map((provincia: ProvinciaData) => (
                <option
                  key={provincia.id_provincia}
                  value={provincia.id_provincia}
                >
                  {provincia.nombre}
                </option>
              ))}
          </select>

          <select
            name="place-2"
            id="place-2"
            disabled={!selectedNivel}
            value={selectedUbicacion2}
            onChange={(e) => setSelectedUbicacion2(e.target.value)}
          >
            <option key="default-option" value="" disabled>
              {loading
                ? "Cargando..."
                : error
                ? "Error al cargar"
                : "Ubicación 2"}
            </option>

            {!loading &&
              !error &&
              selectedNivel === "pais" &&
              paises.map((pais: PaisData) => (
                <option key={pais.id_pais} value={pais.id_pais}>
                  {pais.nombre}
                </option>
              ))}

            {!loading &&
              !error &&
              selectedNivel === "region" &&
              regiones.map((region: RegionData) => (
                <option key={region.id_region} value={region.id_region}>
                  {region.nombre}
                </option>
              ))}

            {!loading &&
              !error &&
              selectedNivel === "provincia" &&
              provincias.map((provincia: ProvinciaData) => (
                <option
                  key={provincia.id_provincia}
                  value={provincia.id_provincia}
                >
                  {provincia.nombre}
                </option>
              ))}
          </select>

          <button type="submit" className="submit-button">
            Ver campañas
          </button>
        </form>
      </nav>
      <div className="top-section">
        <CountryCropsSection />
        <CountryChartsSection />
      </div>
      <div className="bottom-section">
        <RegionChartsSection
          añoDesde={appliedFilters.añoDesde}
          añoHasta={appliedFilters.añoHasta}
          cultivo={appliedFilters.cultivo}
          nivel={appliedFilters.nivel}
          ubicacion1={appliedFilters.ubicacion1}
          ubicacion2={appliedFilters.ubicacion2}
        />
        <ComparativeCropsSection />
      </div>
    </div>
  );
};
