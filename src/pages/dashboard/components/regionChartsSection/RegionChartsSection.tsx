import "./RegionChartsSection.css";
import type { RegionChartsSectionProps } from "../../../../types/RegionChartsSectionProps";
import { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/authContext";
import axiosInstance from "../../../../config/axios";
import type { CampañaData } from "../../../../types/CampañaData";

export const RegionChartsSection = ({
  añoDesde,
  añoHasta,
  cultivo,
  nivel,
  ubicacion1,
  ubicacion2,
}: RegionChartsSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [campañas1, setCampañas1] = useState<CampañaData[]>([]);
  const [campañas2, setCampañas2] = useState<CampañaData[]>([]);

  const auth = useAuth();

  useEffect(() => {
    // función auxiliar para hacer un solo fetch
    const fetchDatosUbicacion = async (locationId: string) => {
      if (!nivel || !locationId) {
        return [];
      }

      const firebaseUID = auth?.currentUser?.uid;
      if (!firebaseUID) {
        throw new Error("El usuario no está autenticado");
      }

      let endpointBase = "";
      if (nivel === "region") {
        endpointBase = "/campana/porRegion";
      } else if (nivel === "provincia") {
        endpointBase = "/campana/porProvincia";
      } else {
        return [];
      }

      const endpoint = `${endpointBase}/${locationId}`;

      const params = {
        añoDesde: añoDesde ? `${añoDesde}-01-01` : undefined,
        añoHasta: añoHasta ? `${añoHasta}-12-31` : undefined,
        cultivo: cultivo || undefined,
      };

      const response = await axiosInstance.get(endpoint, { params });
      return response.data.data || [];
    };

    const loadAllData = async () => {
      if (!nivel) {
        setCampañas1([]);
        setCampañas2([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [data1, data2] = await Promise.all([
          fetchDatosUbicacion(ubicacion1),
          fetchDatosUbicacion(ubicacion2),
        ]);

        setCampañas1(data1);
        setCampañas2(data2);

        console.debug("API response for Ubicacion 1:", data1);
        console.debug("API response for Ubicacion 2:", data2);
      } catch (error: any) {
        setError(error.message || "Error desconocido");
        console.debug("Error fetching data:", error);
        setCampañas1([]);
        setCampañas2([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [añoDesde, añoHasta, cultivo, nivel, ubicacion1, ubicacion2, auth]);

  if (loading) {
    return (
      <section className="region-charts-section">
        <p>Cargando datos...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="region-charts-section">
        <p>Error: {error.message}</p>
      </section>
    );
  }

  if (campañas1.length === 0 && campañas2.length === 0 && !loading) {
    return (
      <section className="region-charts-section">
        <p>
          Seleccione filtros y presione "Ver campañas" para mostrar gráficos.
        </p>
      </section>
    );
  }

  return (
    <section className="region-charts-section">
      {/* gráficos */}
      {campañas1.length > 0 && (
        <div>
          <h4>Resultados para Ubicación 1</h4>
          {/* <ComponenteDeGrafico data={campañas1} /> */}
        </div>
      )}
      {campañas2.length > 0 && (
        <div>
          <h4>Resultados para Ubicación 2</h4>
          {/* <ComponenteDeGrafico data={campañas2} /> */}
        </div>
      )}
    </section>
  );
};
