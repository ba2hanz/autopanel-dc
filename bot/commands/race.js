const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const UserInventory = require('../models/UserInventory');
const Car = require('../models/Car');
const Upgrade = require('../models/Upgrade');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('race')
    .setDescription('Race your car against another user')
    .addUserOption(option =>
      option.setName('opponent')
        .setDescription('The user to race against')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Amount to bet (minimum 100)')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const challenger = interaction.user;
    const opponent = interaction.options.getUser('opponent');
    const betAmount = interaction.options.getInteger('bet');

    if (betAmount < 100) {
      return interaction.editReply('Minimum bet amount is 100!');
    }

    if (challenger.id === opponent.id) {
      return interaction.editReply('You cannot race against yourself!');
    }

    try {
      // Get both users' inventories
      const challengerInventory = await UserInventory.findOne({ userId: challenger.id });
      const opponentInventory = await UserInventory.findOne({ userId: opponent.id });

      if (!challengerInventory || !opponentInventory) {
        return interaction.editReply('Both users need to have an inventory to race!');
      }

      // Check if users have enough balance
      if (challengerInventory.balance < betAmount || opponentInventory.balance < betAmount) {
        return interaction.editReply('Both users need to have enough balance for the bet!');
      }

      // Get active cars
      const challengerCar = challengerInventory.cars.find(car => car.isActive);
      const opponentCar = opponentInventory.cars.find(car => car.isActive);

      if (!challengerCar || !opponentCar) {
        return interaction.editReply('Both users need to have an active car to race!');
      }

      // Get car details
      const challengerCarDetails = await Car.findById(challengerCar.carId);
      const opponentCarDetails = await Car.findById(opponentCar.carId);

      // Calculate total stats including upgrades
      const challengerStats = calculateTotalStats(challengerCarDetails, challengerCar.upgrades);
      const opponentStats = calculateTotalStats(opponentCarDetails, opponentCar.upgrades);

      // Simulate race
      const raceResult = simulateRace(challengerStats, opponentStats);
      const winner = raceResult.winner === 'challenger' ? challenger : opponent;
      const loser = raceResult.winner === 'challenger' ? opponent : challenger;

      // Update balances
      if (raceResult.winner === 'challenger') {
        challengerInventory.balance += betAmount;
        opponentInventory.balance -= betAmount;
        challengerInventory.stats.racesWon += 1;
        opponentInventory.stats.racesLost += 1;
      } else {
        challengerInventory.balance -= betAmount;
        opponentInventory.balance += betAmount;
        challengerInventory.stats.racesLost += 1;
        opponentInventory.stats.racesWon += 1;
      }

      await challengerInventory.save();
      await opponentInventory.save();

      // Create race result embed
      const embed = new EmbedBuilder()
        .setTitle('🏎️ Race Results')
        .setColor(raceResult.winner === 'challenger' ? '#00ff00' : '#ff0000')
        .addFields(
          { name: 'Winner', value: winner.username, inline: true },
          { name: 'Bet Amount', value: `${betAmount} coins`, inline: true },
          { name: 'Race Time', value: `${raceResult.time.toFixed(2)}s`, inline: true },
          { name: 'Challenger Car', value: challengerCarDetails.name, inline: true },
          { name: 'Opponent Car', value: opponentCarDetails.name, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Race error:', error);
      await interaction.editReply('An error occurred during the race!');
    }
  }
};

function calculateTotalStats(car, upgrades) {
  const stats = {
    speed: car.baseStats.speed,
    power: car.baseStats.power,
    handling: car.baseStats.handling
  };

  // Apply upgrade effects
  upgrades.forEach(upgrade => {
    stats.speed += upgrade.buffs.speed - upgrade.nerfs.speed;
    stats.power += upgrade.buffs.power - upgrade.nerfs.power;
    stats.handling += upgrade.buffs.handling - upgrade.nerfs.handling;
  });

  // Ensure stats are within bounds
  Object.keys(stats).forEach(stat => {
    stats[stat] = Math.max(1, Math.min(100, stats[stat]));
  });

  return stats;
}

function simulateRace(challengerStats, opponentStats) {
  // Calculate base race time (lower is better)
  const challengerTime = calculateRaceTime(challengerStats);
  const opponentTime = calculateRaceTime(opponentStats);

  // Add some randomness
  const challengerRandom = Math.random() * 2 - 1;
  const opponentRandom = Math.random() * 2 - 1;

  const finalChallengerTime = challengerTime + challengerRandom;
  const finalOpponentTime = opponentTime + opponentRandom;

  return {
    winner: finalChallengerTime < finalOpponentTime ? 'challenger' : 'opponent',
    time: Math.min(finalChallengerTime, finalOpponentTime)
  };
}

function calculateRaceTime(stats) {
  // Base time is 10 seconds
  const baseTime = 10;
  
  // Calculate time reduction based on stats
  const speedReduction = (stats.speed / 100) * 3; // Up to 3 seconds reduction
  const powerReduction = (stats.power / 100) * 2; // Up to 2 seconds reduction
  const handlingReduction = (stats.handling / 100) * 1; // Up to 1 second reduction

  return baseTime - speedReduction - powerReduction - handlingReduction;
} 