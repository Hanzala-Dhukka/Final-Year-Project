import {
  FaBox,
  FaExclamationTriangle,
  FaArrowUp,
  FaShieldAlt
} from "react-icons/fa";

import "./DependencyDashboard.css";


function SeverityBadge({ severity }) {

  const color =
    severity?.toLowerCase();


  return (

    <span
      className={`dependency-severity ${color}`}
    >

      {severity}

    </span>

  )

}



export default function DependencyDashboard({
  dependencyReport,
  dependencyFindings = []
}) {


  return (

    <div className="dependency-container">


      <h2>
        <FaShieldAlt />
        Dependency Security Dashboard
      </h2>



      {/* Summary Cards */}

      <div className="dependency-cards">


        <div className="dependency-card">

          <FaBox />

          <div>

            <p>Total Packages</p>

            <h2>
              {dependencyReport?.total_packages ?? 0}
            </h2>

          </div>

        </div>





        <div className="dependency-card warning">

          <FaArrowUp />

          <div>

            <p>Outdated</p>

            <h2>
              {dependencyReport?.outdated ?? 0}
            </h2>

          </div>

        </div>





        <div className="dependency-card danger">

          <FaExclamationTriangle />

          <div>

            <p>Risky Packages</p>

            <h2>
              {dependencyReport?.risky ?? 0}
            </h2>

          </div>

        </div>





        <div className="dependency-card">

          <FaShieldAlt />

          <div>

            <p>Unpinned</p>

            <h2>
              {dependencyReport?.unpinned ?? 0}
            </h2>

          </div>

        </div>

      </div>





      {/* Files Scanned */}

      <div className="dependency-files">


        <h3>
          Files Scanned
        </h3>


        {
          dependencyReport?.files_scanned?.map(
            (file, index) => (

              <span key={index}>

                {file}

              </span>

            )
          )

        }


      </div>





      {/* Dependency Table */}


      <div className="dependency-table-wrapper">


        <h3>
          Dependency Findings
        </h3>




        <table className="dependency-table">


          <thead>

            <tr>

              <th>
                Package
              </th>

              <th>
                Version
              </th>


              <th>
                Status
              </th>


              <th>
                Severity
              </th>


              <th>
                Reason
              </th>


              <th>
                Recommendation
              </th>


            </tr>


          </thead>





          <tbody>


            {

              dependencyFindings.map(
                (dep, index) => (


                  <tr key={index}>


                    <td className="package-name">

                      {dep.package}

                    </td>





                    <td>

                      {dep.version}

                    </td>





                    <td>

                      {dep.status}

                    </td>





                    <td>

                      <SeverityBadge
                        severity={dep.severity}
                      />

                    </td>





                    <td>

                      {dep.reason || "-"}

                    </td>





                    <td>

                      {dep.recommendation || "-"}

                    </td>


                  </tr>


                )
              )

            }





          </tbody>


        </table>





      </div>



    </div>

  )

}