import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const PieChart = ({ projects }) => {
    const chartRef = useRef(null); // Référence pour le canvas
    const chartInstance = useRef(null); // Référence pour l'instance du graphique

    // Préparer les données pour le graphique
    const getStatusCounts = () => {
        const statusCounts = {
            'Not Started': 0,
            'In Progress': 0,
            'Completed': 0,
            'Archived': 0,
        };

        projects.forEach(project => {
            if (statusCounts.hasOwnProperty(project.status)) {
                statusCounts[project.status]++;
            }
        });

        return statusCounts;
    };

    useEffect(() => {
        const statusCounts = getStatusCounts();

        // Détruire l'ancien graphique s'il existe
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Créer un nouveau graphique
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [
                    {
                        label: 'Projects by Status',
                        data: Object.values(statusCounts),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)', // Not Started
                            'rgba(54, 162, 235, 0.6)', // In Progress
                            'rgba(75, 192, 192, 0.6)', // Completed
                            'rgba(153, 102, 255, 0.6)', // Archived
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                        ],
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: false, // Désactiver la responsivité
                maintainAspectRatio: false, // Ne pas maintenir le ratio d'aspect
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Répartition des projets par statut',
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

    return <canvas ref={chartRef} width="300" height="300" />; // Taille fixe du canvas
};

export default PieChart;