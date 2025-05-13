import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const LineChart = ({ projects }) => {
    const chartRef = useRef(null); // Référence pour le canvas
    const chartInstance = useRef(null); // Référence pour l'instance du graphique

    // Préparer les données pour le graphique
    const getProjectsByMonth = () => {
        const projectsByStartMonth = Array(12).fill(0); // Projets par mois de début
        const projectsByEndMonth = Array(12).fill(0); // Projets par mois de fin

        projects.forEach(project => {
            const startDate = new Date(project.start_date);
            const endDate = new Date(project.end_date);

            const startMonth = startDate.getMonth(); // Mois de début (0 pour janvier, 11 pour décembre)
            const endMonth = endDate.getMonth(); // Mois de fin

            projectsByStartMonth[startMonth]++;
            projectsByEndMonth[endMonth]++;
        });

        return { projectsByStartMonth, projectsByEndMonth };
    };

    useEffect(() => {
        const { projectsByStartMonth, projectsByEndMonth } = getProjectsByMonth();

        // Détruire l'ancien graphique s'il existe
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Créer un nouveau graphique
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [
                    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                ], // Noms des mois
                datasets: [
                    {
                        label: 'Projets démarrés par mois',
                        data: projectsByStartMonth,
                        borderColor: 'rgba(75, 192, 192, 1)', // Couleur de la ligne (bleu)
                        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Couleur de remplissage
                        borderWidth: 2,
                        fill: true, // Remplir la zone sous la courbe
                    },
                    {
                        label: 'Projets terminés par mois',
                        data: projectsByEndMonth,
                        borderColor: 'rgba(255, 99, 132, 1)', // Couleur de la ligne (rouge)
                        backgroundColor: 'rgba(255, 99, 132, 0.2)', // Couleur de remplissage
                        borderWidth: 2,
                        fill: true, // Remplir la zone sous la courbe
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Projets démarrés et terminés par mois',
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Mois',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Nombre de projets',
                        },
                        beginAtZero: true, // Commencer l'axe Y à 0
                    },
                },
            },
        });

        // Nettoyer le graphique lors du démontage du composant
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [projects]);

    return <canvas ref={chartRef} />;
};

export default LineChart;