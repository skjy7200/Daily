import React from 'react';
import './PokemonCard.css';

const PokemonCard = ({ pokemon }) => {
  if (!pokemon) {
    return <div className="pokemon-card empty"></div>;
  }

  const { name, type, image } = pokemon;

  return (
    <div className="pokemon-card">
      <img src={image.thumbnail} alt={name.english} className="pokemon-image" />
      <h3 className="pokemon-name">{name.english}</h3>
      <div className="pokemon-types">
        {type.map((t) => (
          <span key={t} className={`pokemon-type type-${t.toLowerCase()}`}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PokemonCard;
