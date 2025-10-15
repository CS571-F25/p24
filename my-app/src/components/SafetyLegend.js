import './SafetyLegend.css';

const SafetyLegend = () => (
  <div className="safety-legend">
    <span className="safety-legend__title">Route layers</span>
    <div className="safety-legend__items">
      <div>
        <span className="safety-legend__swatch safety-legend__swatch--safest" />
        Safest
      </div>
      <div>
        <span className="safety-legend__swatch safety-legend__swatch--balanced" />
        Balanced
      </div>
      <div>
        <span className="safety-legend__swatch safety-legend__swatch--fastest" />
        Fastest
      </div>
    </div>
    <p>Safety scores blend crime data, lighting reports, and community feedback.</p>
  </div>
);

export default SafetyLegend;
