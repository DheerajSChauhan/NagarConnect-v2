import PropTypes from 'prop-types';
import { priorities } from "../data/mockData";

const PriorityBadge = ({ priority, className = "" }) => {
  const safePriority = priorities[priority] || priorities.low;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white ${className}`}
      style={{ backgroundColor: safePriority.color }}
    >
      {safePriority.label}
    </span>
  );
};

PriorityBadge.propTypes = {
  priority: PropTypes.string,
  className: PropTypes.string,
};

PriorityBadge.defaultProps = {
  priority: 'low',
  className: '',
};

export default PriorityBadge;
