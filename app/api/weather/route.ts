import { fetchWeatherApi } from "openmeteo";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const params = {
			latitude: 30.628,
			longitude: -96.3344,
			daily: ["temperature_2m_max", "temperature_2m_min"],
			hourly: "temperature_2m",
			timezone: "auto",
			forecast_days: 1,
			temperature_unit: "fahrenheit",
		};
		const url = "https://api.open-meteo.com/v1/forecast";
		const responses = await fetchWeatherApi(url, params);

		const response = responses[0];
		const latitude = response.latitude();
		const longitude = response.longitude();
		const utcOffsetSeconds = response.utcOffsetSeconds();

		const hourly = response.hourly()!;
		const daily = response.daily()!;

		const weatherData = {
			latitude,
			longitude,
			daily: {
				time: Array.from(
					{ length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
					(_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
				),
				temperature_2m_max: daily.variables(0)!.valuesArray(),
				temperature_2m_min: daily.variables(1)!.valuesArray(),
			},
			current: {
				temperature:
					(hourly.variables(0)!.valuesArray() as Float32Array)[0],
			},
		};

		return NextResponse.json(weatherData);
	} catch (error) {
		console.error("Weather API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch weather data" },
			{ status: 500 }
		);
	}
}