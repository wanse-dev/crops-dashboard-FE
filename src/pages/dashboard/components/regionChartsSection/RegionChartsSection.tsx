import "./RegionChartsSection.css";
import type { RegionChartsSectionProps } from "../../../../types/RegionChartsSectionProps";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../../contexts/authContext";
import axiosInstance from "../../../../config/axios";
import type { CampañaData } from "../../../../types/CampañaData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

  const [nombreUbicacion1, setNombreUbicacion1] = useState("Ubicacion 1");
  const [nombreUbicacion2, setNombreUbicacion2] = useState("Ubicacion 2");

  const auth = useAuth();

  useEffect(() => {
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
      } else if (nivel === "pais") {
        endpointBase = "/campana/porPais";
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

        const getNameFromData = (
          data: any[],
          currentNivel: string
        ): string | null => {
          if (!data || data.length === 0) return null;
          const item = data[0];
          if (currentNivel === "provincia" && item.provincia)
            return item.provincia;
          if (currentNivel === "region" && item.region) return item.region;
          if (currentNivel === "pais" && item.pais) return item.pais;
          return null;
        };

        setNombreUbicacion1(getNameFromData(data1, nivel) || "Ubicacion 1");
        setNombreUbicacion2(getNameFromData(data2, nivel) || "Ubicacion 2");

        setCampañas1(data1);
        setCampañas2(data2);

        console.debug("API response for Ubicacion 1:", data1);
        console.debug("API response for Ubicacion 2:", data2);
      } catch (error: any) {
        setError(error.message || "Error desconocido");
        console.debug("Error fetching data:", error);
        setCampañas1([]);
        setCampañas2([]);
        setNombreUbicacion1("Ubicacion 1");
        setNombreUbicacion2("Ubicacion 2");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [añoDesde, añoHasta, cultivo, nivel, ubicacion1, ubicacion2, auth]);

  const processedData = useMemo(() => {
    const getYear = (item: any): number | null => {
      if (!item || !item.año) return null;

      const añoVal = item.año;

      if (typeof añoVal === "number") {
        return añoVal;
      }

      if (typeof añoVal === "string") {
        const yearStr = añoVal.substring(0, 4);
        const year = parseInt(yearStr, 10);

        if (!isNaN(year) && yearStr.length === 4) {
          return year;
        }
      }

      try {
        const year = new Date(añoVal).getUTCFullYear();
        return isNaN(year) ? null : year;
      } catch (e) {
        return null;
      }
    };

    const getMetric = (item: any): number | null => {
      const metricKey = "total_ha_sembradas";
      if (
        item === null ||
        item === undefined ||
        item[metricKey] === null ||
        item[metricKey] === undefined
      ) {
        return null;
      }
      const metric = parseFloat(item[metricKey]);
      return isNaN(metric) ? null : metric;
    };

    const apiDataMap = new Map<
      number,
      { u1: number | null; u2: number | null }
    >();

    campañas1.forEach((item) => {
      const year = getYear(item);
      const metric = getMetric(item);
      if (year) {
        apiDataMap.set(year, { u1: metric, u2: null });
      }
    });

    campañas2.forEach((item) => {
      const year = getYear(item);
      const metric = getMetric(item);
      if (year) {
        const existing = apiDataMap.get(year) || { u1: null, u2: null };
        apiDataMap.set(year, { ...existing, u2: metric });
      }
    });

    const finalChartMap = new Map<
      number,
      { u1: number | null; u2: number | null }
    >();
    const startYear = parseInt(añoDesde, 10);
    const endYear = parseInt(añoHasta, 10);

    if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
      for (let i = startYear; i <= endYear; i++) {
        const apiData = apiDataMap.get(i);

        if (apiData) {
          finalChartMap.set(i, apiData);
        } else {
          finalChartMap.set(i, { u1: null, u2: null });
        }
      }
    } else if (apiDataMap.size > 0) {
      apiDataMap.forEach((value, key) => {
        finalChartMap.set(key, value);
      });
    }

    const combined = Array.from(finalChartMap.entries()).map(
      ([year, data]) => ({
        name: year.toString(),
        [nombreUbicacion1]: data.u1,
        [nombreUbicacion2]: data.u2,
      })
    );

    combined.sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

    console.log("Datos procesados para Recharts:", combined);

    return combined;
  }, [
    campañas1,
    campañas2,
    nombreUbicacion1,
    nombreUbicacion2,
    añoDesde,
    añoHasta,
  ]);

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
  if (processedData.length === 0 && !loading) {
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
      <h3>Hectáreas sembradas por año</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey={nombreUbicacion1}
              stroke="#93c2a1"
              activeDot={{ r: 8 }}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey={nombreUbicacion2}
              stroke="#316a47"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
