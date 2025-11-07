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
    const getMetricValue = (item: any, metricKey: string): number | null => {
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
      {
        u1_sembradas: number | null;
        u1_cosechadas: number | null;
        u2_sembradas: number | null;
        u2_cosechadas: number | null;
      }
    >();
    campañas1.forEach((item) => {
      const year = getYear(item);
      const metricSembradas = getMetricValue(item, "total_ha_sembradas");
      const metricCosechadas = getMetricValue(item, "total_ha_cosechadas");
      if (year) {
        apiDataMap.set(year, {
          u1_sembradas: metricSembradas,
          u1_cosechadas: metricCosechadas,
          u2_sembradas: null,
          u2_cosechadas: null,
        });
      }
    });
    campañas2.forEach((item) => {
      const year = getYear(item);
      const metricSembradas = getMetricValue(item, "total_ha_sembradas");
      const metricCosechadas = getMetricValue(item, "total_ha_cosechadas");
      if (year) {
        const existing = apiDataMap.get(year) || {
          u1_sembradas: null,
          u1_cosechadas: null,
          u2_sembradas: null,
          u2_cosechadas: null,
        };
        apiDataMap.set(year, {
          ...existing,
          u2_sembradas: metricSembradas,
          u2_cosechadas: metricCosechadas,
        });
      }
    });
    const finalChartMap = new Map<
      number,
      {
        u1_sembradas: number | null;
        u1_cosechadas: number | null;
        u2_sembradas: number | null;
        u2_cosechadas: number | null;
      }
    >();
    const startYear = parseInt(añoDesde, 10);
    const endYear = parseInt(añoHasta, 10);
    if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
      for (let i = startYear; i <= endYear; i++) {
        const apiData = apiDataMap.get(i);
        if (apiData) {
          finalChartMap.set(i, apiData);
        } else {
          finalChartMap.set(i, {
            u1_sembradas: null,
            u1_cosechadas: null,
            u2_sembradas: null,
            u2_cosechadas: null,
          });
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
        [`${nombreUbicacion1} (Sembradas)`]: data.u1_sembradas,
        [`${nombreUbicacion1} (Cosechadas)`]: data.u1_cosechadas,
        [`${nombreUbicacion2} (Sembradas)`]: data.u2_sembradas,
        [`${nombreUbicacion2} (Cosechadas)`]: data.u2_cosechadas,
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

  const renderLegend = (props: any) => {
    const { payload } = props;

    const entry1 = payload.find(
      (entry: any) => entry.value === `${nombreUbicacion1} (Sembradas)`
    );
    const entry2 = payload.find(
      (entry: any) => entry.value === `${nombreUbicacion2} (Sembradas)`
    );

    const renderItem = (entry: any, label: string) => {
      if (!entry) return null;

      return (
        <li
          key={entry.value}
          style={{
            display: "inline-block",
            marginRight: "10px",
            cursor: "pointer",
          }}
        >
          <svg
            width="14"
            height="10"
            style={{
              display: "inline-block",
              marginRight: "5px",
              verticalAlign: "middle",
            }}
          >
            <line
              x1="0"
              y1="5"
              x2="14"
              y2="5"
              stroke={entry.color}
              strokeWidth="2"
            />
          </svg>
          <span style={{ color: "#333", verticalAlign: "middle" }}>
            {label}
          </span>
        </li>
      );
    };

    return (
      <ul
        style={{
          listStyle: "none",
          margin: "0",
          padding: "0",
          textAlign: "center",
        }}
      >
        {ubicacion1 && entry1 && renderItem(entry1, nombreUbicacion1)}

        {ubicacion2 && entry2 && renderItem(entry2, nombreUbicacion2)}
      </ul>
    );
  };

  return (
    <section className="region-charts-section">
      <h3>Hectáreas sembradas y cosechadas por año</h3>
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
            <Legend content={renderLegend} />

            <Line
              type="monotone"
              dataKey={`${nombreUbicacion1} (Sembradas)`}
              stroke="#93c2a1"
              activeDot={{ r: 8 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey={`${nombreUbicacion1} (Cosechadas)`}
              stroke="#93c2a1"
              strokeDasharray="5 5"
              connectNulls
              dot={false}
              activeDot={false}
            />

            <Line
              type="monotone"
              dataKey={`${nombreUbicacion2} (Sembradas)`}
              stroke="#316a47"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey={`${nombreUbicacion2} (Cosechadas)`}
              stroke="#316a47"
              strokeDasharray="5 5"
              connectNulls
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
