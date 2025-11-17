import "./NotFoundPage.css"
import robo404 from "../../assets/Oops! 404 Error with a broken robot-cuate (4) 1.png"

const NotFoundPage = () => {
  return (
    <div className="not-found">
      <div className="not-found__imagem">
        <img src={robo404} />
      </div>
    </div>
  )
}

export default NotFoundPage
