import config from "../../../network.json";

export const NetworkSelectOptions: React.FC = () => {
  return (
    <>
      {Object.entries(config).map(([key, { name }], i) => {
        return (
          <option key={i} value={key}>
            {name}
          </option>
        );
      })}
    </>
  );
};
