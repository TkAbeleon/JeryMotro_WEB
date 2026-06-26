# NASA FIRMS API Documentation

## Introduction

NASA FIRMS (Fire Information for Resource Management System) provides near real-time and historical fire detection data from multiple satellite sensors.

Base URL:

```text
https://firms.modaps.eosdis.nasa.gov/api/
```

Authentication is performed using a `MAP_KEY`.

---

# Getting an API Key

Request a key from:

```text
https://firms.modaps.eosdis.nasa.gov/api/map_key/
```

The key will be sent to your email address.

---

# Rate Limits

| Limit        | Value      |
| ------------ | ---------- |
| Transactions | 5000       |
| Time Window  | 10 minutes |

---

# Check API Usage

## Endpoint

```http
GET https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=YOUR_KEY
```

## Example Response

```json
{
  "transaction_limit": 5000,
  "current_transactions": 142,
  "transaction_interval": "10 minutes"
}
```

---

# Available Datasets

## MODIS

```text
MODIS_NRT
MODIS_SP
```

## VIIRS

```text
VIIRS_SNPP_NRT
VIIRS_SNPP_SP

VIIRS_NOAA20_NRT
VIIRS_NOAA20_SP

VIIRS_NOAA21_NRT
```

## LANDSAT

```text
LANDSAT_NRT
```

## GOES

```text
GOES_NRT
```

## Burned Areas

```text
BA_MODIS
BA_VIIRS
```

---

# Data Availability Endpoint

Returns the date range available for each dataset.

## Endpoint

```http
GET /api/data_availability/csv/{MAP_KEY}/all
```

## Example

```http
GET https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/YOUR_KEY/all
```

## Response

```csv
data_id,min_date,max_date
MODIS_NRT,2025-01-01,2026-06-12
VIIRS_SNPP_NRT,2025-01-01,2026-06-12
```

---

# Area Endpoint

Returns fire detections inside a geographic area.

## Endpoint

```http
GET /api/area/csv/{MAP_KEY}/{SOURCE}/{AREA}/{DAYS}
```

## Parameters

| Parameter | Description           |
| --------- | --------------------- |
| MAP_KEY   | API Key               |
| SOURCE    | Dataset               |
| AREA      | Bounding box or world |
| DAYS      | Number of days        |

---

## World Query

### Last 24 Hours

```http
GET /api/area/csv/YOUR_KEY/VIIRS_SNPP_NRT/world/1
```

### Last 7 Days

```http
GET /api/area/csv/YOUR_KEY/VIIRS_SNPP_NRT/world/7
```

---

## Bounding Box Query

Format:

```text
west,south,east,north
```

Example for Madagascar:

```text
43,-26,51,-11
```

Request:

```http
GET /api/area/csv/YOUR_KEY/VIIRS_SNPP_NRT/43,-26,51,-11/7
```

---

# Countries Endpoint

Returns all supported countries.

## Endpoint

```http
GET https://firms.modaps.eosdis.nasa.gov/api/countries
```

## Example Response

```json
[
  {
    "id": 129,
    "abbreviation": "MDG",
    "name": "Madagascar"
  }
]
```

---

# Country Endpoint

Returns fire detections for a country.

## Endpoint

```http
GET /api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAYS}
```

## Parameters

| Parameter | Description      |
| --------- | ---------------- |
| MAP_KEY   | API Key          |
| SOURCE    | Dataset          |
| COUNTRY   | ISO Country Code |
| DAYS      | Number of days   |

---

## Madagascar Example

```http
GET /api/country/csv/YOUR_KEY/VIIRS_SNPP_NRT/MDG/7
```

---

# VIIRS Response Fields

| Field      | Description            |
| ---------- | ---------------------- |
| latitude   | Latitude               |
| longitude  | Longitude              |
| bright_ti4 | Brightness temperature |
| scan       | Pixel width            |
| track      | Pixel height           |
| acq_date   | Acquisition date       |
| acq_time   | Acquisition time (UTC) |
| satellite  | Satellite name         |
| instrument | Sensor                 |
| confidence | Detection confidence   |
| bright_ti5 | Secondary temperature  |
| frp        | Fire Radiative Power   |
| daynight   | D or N                 |

---

# MODIS Response Fields

| Field      | Description            |
| ---------- | ---------------------- |
| latitude   | Latitude               |
| longitude  | Longitude              |
| brightness | Brightness temperature |
| scan       | Pixel width            |
| track      | Pixel height           |
| acq_date   | Date                   |
| acq_time   | UTC Time               |
| satellite  | Terra or Aqua          |
| confidence | Confidence level       |
| version    | Product version        |
| bright_t31 | Brightness band 31     |
| frp        | Fire Radiative Power   |
| daynight   | Day or Night           |

---

# Python Example

## Install Dependencies

```bash
pip install pandas requests
```

---

## Retrieve Madagascar Fires

```python
import pandas as pd

MAP_KEY = "YOUR_KEY"

url = (
    "https://firms.modaps.eosdis.nasa.gov/api/country/csv/"
    f"{MAP_KEY}/VIIRS_SNPP_NRT/MDG/7"
)

df = pd.read_csv(url)

print(df.head())
```

---

# Download World Fire Data

```python
import pandas as pd

MAP_KEY = "YOUR_KEY"

url = (
    "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
    f"{MAP_KEY}/VIIRS_SNPP_NRT/world/1"
)

df = pd.read_csv(url)

print(len(df))
```

---

# Error Handling

## Invalid API Key

```json
{
  "error": "Invalid MAP_KEY"
}
```

## Rate Limit Exceeded

```json
{
  "error": "Transaction limit exceeded"
}
```

---

# Recommended Datasets

## Near Real-Time Monitoring

```text
VIIRS_SNPP_NRT
VIIRS_NOAA20_NRT
VIIRS_NOAA21_NRT
```

Use for:

- Monitoring
- Alert systems
- Dashboards
- Deforestation surveillance

---

## Scientific Analysis

```text
MODIS_SP
VIIRS_SNPP_SP
VIIRS_NOAA20_SP
```

Use for:

- Research
- Machine Learning
- Long-term statistics
- Environmental studies

---

# Typical Workflow

```text
NASA FIRMS API
      |
      v
Python Collector
      |
      v
Data Cleaning
      |
      v
MongoDB / PostgreSQL
      |
      v
Machine Learning Model
      |
      v
Alerting System
      |
      v
Dashboard
```

---

# Useful Links

## FIRMS Homepage

```text
https://firms.modaps.eosdis.nasa.gov/
```

## API Documentation

```text
https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html
```

## MAP_KEY Request

```text
https://firms.modaps.eosdis.nasa.gov/api/map_key/
```

## Countries List

```text
https://firms.modaps.eosdis.nasa.gov/api/countries
```
