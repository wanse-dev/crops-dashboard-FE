import "./ComparativeCropsSection.css";
import { useState, useEffect, useMemo } from "react";
import type { RegionChartsSectionProps } from "../../../../types/RegionChartsSectionProps";
import type { HaPerdidasData } from "../../../../types/HaPerdidasData";
import type { PromedioData } from "../../../../types/PromedioData";
import { useAuth } from "../../../../contexts/authContext";
import axiosInstance from "../../../../config/axios";

// helper para el umbral
const UmbralDot = ({ status }: { status: string }) => {
  return <div className={`umbral-dot ${status}`} />;
};

// helper para parsear el año
const getYear = (item: any): number | null => {
  if (!item || !item.año) return null;
  const añoVal = item.año;
  if (typeof añoVal === "number") return añoVal;
  if (typeof añoVal === "string") {
    const yearStr = añoVal.substring(0, 4);
    const year = parseInt(yearStr, 10);
    if (!isNaN(year) && yearStr.length === 4) return year;
  }
  try {
    const year = new Date(añoVal).getUTCFullYear();
    return isNaN(year) ? null : year;
  } catch (e) {
    return null;
  }
};

export const ComparativeCropsSection = ({
  añoDesde,
  añoHasta,
  cultivo,
  nivel,
  ubicacion1,
  ubicacion2,
}: RegionChartsSectionProps) => {
  const [selectedButton, setSelectedButton] = useState("place1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [campañas1, setCampañas1] = useState<HaPerdidasData[]>([]);
  const [campañas2, setCampañas2] = useState<HaPerdidasData[]>([]);

  const [promedio1, setPromedio1] = useState<PromedioData | null>(null);
  const [promedio2, setPromedio2] = useState<PromedioData | null>(null);

  const [nombreUbicacion1, setNombreUbicacion1] = useState("Ubicacion 1");
  const [nombreUbicacion2, setNombreUbicacion2] = useState("Ubicacion 2");

  const auth = useAuth();

  // --- CAMBIO 1 ---
  // Este useEffect fuerza el botón seleccionado si solo hay una ubicación
  useEffect(() => {
    const hasUbi1 = !!ubicacion1;
    const hasUbi2 = !!ubicacion2;

    if (hasUbi1 && !hasUbi2) {
      setSelectedButton("place1");
    } else if (!hasUbi1 && hasUbi2) {
      setSelectedButton("place2");
    } else if (!hasUbi1 && !hasUbi2) {
      setSelectedButton("place1"); // Resetea si ambas se limpian
    }
  }, [ubicacion1, ubicacion2]);

  useEffect(() => {
    const fetchDatosUbicacion = async (locationId: string) => {
      if (!nivel || !locationId) return [];
      const firebaseUID = auth?.currentUser?.uid;
      if (!firebaseUID) throw new Error("El usuario no está autenticado");

      let endpointBase = "";
      if (nivel === "region") {
        endpointBase = "/campana/haPerdidasPorRegion";
      } else if (nivel === "provincia") {
        endpointBase = "/campana/haPerdidasPorProvincia";
      } else if (nivel === "pais") {
        endpointBase = "/campana/haPerdidasPorPais";
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

    const fetchPromedioUbicacion = async (locationId: string) => {
      if (!nivel || !locationId) return null;
      const firebaseUID = auth?.currentUser?.uid;
      if (!firebaseUID) throw new Error("El usuario no está autenticado");

      let endpointBase = "";
      if (nivel === "region") {
        endpointBase = "/campana/promHaPerdidasPorRegion";
      } else if (nivel === "provincia") {
        endpointBase = "/campana/promHaPerdidasPorProvincia";
      } else if (nivel === "pais") {
        endpointBase = "/campana/promHaPerdidasPorPais";
      } else {
        return null;
      }

      const endpoint = `${endpointBase}/${locationId}`;
      const params = {
        añoDesde: añoDesde ? `${añoDesde}-01-01` : undefined,
        añoHasta: añoHasta ? `${añoHasta}-12-31` : undefined,
        cultivo: cultivo || undefined,
      };
      const response = await axiosInstance.get(endpoint, { params });

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      return null;
    };

    // ejecución de todas las llamadas
    const loadAllData = async () => {
      // --- CAMBIO 2 ---
      // Se modificó la condición: ahora se ejecuta si hay AL MENOS UNA ubicación
      if (!nivel || (!ubicacion1 && !ubicacion2)) {
        setCampañas1([]);
        setCampañas2([]);
        setPromedio1(null);
        setPromedio2(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // ejecución de cuatro llamadas en paralelo
        const [data1, data2, avg1, avg2] = await Promise.all([
          fetchDatosUbicacion(ubicacion1),
          fetchDatosUbicacion(ubicacion2),
          fetchPromedioUbicacion(ubicacion1), // traigo el promedio de la ubi 1
          fetchPromedioUbicacion(ubicacion2), // traigo el promedio de la ubi 2
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

        // se guardan todos los promedios en los estados
        setPromedio1(avg1);
        setPromedio2(avg2);
      } catch (error: any) {
        setError(error.message || "Error desconocido");
        console.debug("Error fetching data:", error);
        setCampañas1([]);
        setCampañas2([]);
        setPromedio1(null);
        setPromedio2(null);
        setNombreUbicacion1("Ubicacion 1");
        setNombreUbicacion2("Ubicacion 2");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [añoDesde, añoHasta, cultivo, nivel, ubicacion1, ubicacion2, auth]);

  const processedData = useMemo(() => {
    const dataToShow = selectedButton === "place1" ? campañas1 : campañas2;
    const averageData = selectedButton === "place1" ? promedio1 : promedio2;

    if (!dataToShow || dataToShow.length === 0) {
      return [];
    }

    const avg = averageData ? averageData.prom_pct_ha_perdidas : null;

    // definición de rangos
    let upperBound: number | undefined, lowerBound: number | undefined;

    if (avg !== undefined && avg !== null) {
      const TOLERANCE_POINTS = 2.0;

      upperBound = avg + TOLERANCE_POINTS; // ej: si avg=10, upperBound=12
      lowerBound = avg - TOLERANCE_POINTS; // ej: si avg=10, lowerBound=8
    }

    // mapeo de datos con el umbral
    const finalData = dataToShow.map((item: any) => {
      const pct = parseFloat(item.pct_ha_perdidas as string);
      const ano = getYear(item);
      let umbralStatus = "medio"; // amarillo

      if (upperBound !== undefined && lowerBound !== undefined) {
        if (pct > upperBound) {
          umbralStatus = "alto"; // rojo
        } else if (pct <= lowerBound) {
          umbralStatus = "bajo"; // verde
        }
      }

      return {
        id: ano,
        año: ano,
        pct_ha_perdidas: pct.toFixed(2),
        umbralStatus: umbralStatus,
      };
    });

    return finalData.sort((a, b) => (b.año ?? 0) - (a.año ?? 0));
  }, [selectedButton, campañas1, campañas2, promedio1, promedio2]);

  // promedio actual dinámico
  const currentAverage = selectedButton === "place1" ? promedio1 : promedio2;

  return (
    <section className="comparative-crops-section">
      <div className="comparative-crops-section-header">
        <h3>Hectáreas perdidas</h3>
        <div className="buttons-container">
          <button
            type="button"
            className={selectedButton === "place1" ? "selected" : ""}
            onClick={() => setSelectedButton("place1")}
            // --- CAMBIO 3 ---
            // El botón se deshabilita si está cargando O si no hay ubicacion1
            disabled={loading || !ubicacion1}
          >
            {nombreUbicacion1}
          </button>
          <button
            type="button"
            className={selectedButton === "place2" ? "selected" : ""}
            onClick={() => setSelectedButton("place2")}
            // --- CAMBIO 4 ---
            // El botón se deshabilita si está cargando O si no hay ubicacion2
            disabled={loading || !ubicacion2}
          >
            {nombreUbicacion2}
          </button>
        </div>
      </div>

      <div className="comparative-crops-average-metric">
        {loading ? (
          <p>Cargando promedio...</p>
        ) : currentAverage ? (
          <>
            <h4>
              Promedio {añoDesde} - {añoHasta}
            </h4>
            <span>
              {parseFloat(
                currentAverage.prom_pct_ha_perdidas.toString()
              ).toFixed(2)}
              %
            </span>
          </>
        ) : (
          <p>No hay datos de promedio para mostrar.</p>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Año</th>
              <th>% Ha perdidas</th>
              <th>Umbral</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3}>Cargando...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={3}>Error: {error.message}</td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={3}>No hay datos para mostrar.</td>
              </tr>
            ) : (
              processedData.map((fila) => (
                <tr key={fila.id}>
                  <td>{fila.año}</td>
                  <td>{fila.pct_ha_perdidas}%</td>
                  <td>
                    <UmbralDot status={fila.umbralStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};