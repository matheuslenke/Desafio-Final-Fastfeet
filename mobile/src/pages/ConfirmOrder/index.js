import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import PropTypes from 'prop-types';
import { RNCamera } from 'react-native-camera';

import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '~/services/api';

import {
  Content,
  Card,
  SubmitButton,
  TakePictureButton,
  CameraActionsDiv,
  ChangeCameraButton,
} from './styles';

import Background from '~/components/Background';

const PendingView = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: 'lightgreen',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text>Waiting</Text>
  </View>
);

export default function ConfirmOrder({ navigation, route }) {
  const [picture, setPicture] = useState(null);
  const [order, setOrder] = useState(route.params.order);
  const [loading, setLoading] = useState(false);
  const [cameraType, setCameraType] = useState(RNCamera.Constants.Type.back);

  async function takePicture(camera) {
    const options = { quality: 0.5, base64: true };
    const data = await camera.takePictureAsync(options);
    //  eslint-disable-next-line
    setPicture({
      uri: data.uri,
      type: 'image/jpeg',
      originalname: `client_signature_delivery_id_${order.id}.jpg`,
    });
  }

  async function handleSubmitSignature() {
    setLoading(true);

    const data = new FormData();

    data.append('file', {
      url: picture.uri,
      name: picture.name,
      type: picture.type,
    });

    try {
      const response = await api.post('files', data);

      const { id: signature_id } = response.data;

      if (response.status === 200) {
        const finishResponse = await api.put(`deliveryman/${order.id}/finish`, {
          signature_id,
        });

        if (finishResponse.status === 200) {
          Alert.alert('Sucesso!', 'Assinatura enviada com sucesso');
          navigation.navigate('Dashboard');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar assinatura, tente novamente');
    }
  }

  function switchCamera() {
    if (cameraType === RNCamera.Constants.Type.back)
      setCameraType(RNCamera.Constants.Type.front);
    else setCameraType(RNCamera.Constants.Type.back);
  }

  return (
    <Background>
      <Content>
        <Card>
          <RNCamera
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.off}
            androidCameraPermissionOptions={{
              title: 'Permissão para utilizar a câmera',
              message: 'Precisamos da sua permissão para utilizar sua câmera',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
            androidRecordAudioPermissionOptions={{
              title: 'Permissão para utilizar seu microfone',
              message:
                'Precisamos de sua permissão para utilizar seu microfone',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
          >
            {({ camera, status }) => {
              if (status !== 'READY') return <PendingView />;
              return (
                <CameraActionsDiv
                  style={{
                    flex: 0,
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <ChangeCameraButton onPress={switchCamera}>
                    <Icon name="switch-camera" size={35} color="#fff" />
                  </ChangeCameraButton>
                  <TakePictureButton onPress={() => takePicture(camera)}>
                    <Icon name="photo-camera" size={35} color="#fff" />
                  </TakePictureButton>
                </CameraActionsDiv>
              );
            }}
          </RNCamera>
        </Card>
        <SubmitButton onPress={handleSubmitSignature}>
          <Text>Enviar</Text>
        </SubmitButton>
      </Content>
    </Background>
  );
}

ConfirmOrder.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.number,
    }),
  }).isRequired,
};